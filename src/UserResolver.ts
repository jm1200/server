import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
  Int
} from "type-graphql";
import { hash, compare } from "bcryptjs";
import { User } from "./entity/User";
import { MyContext } from "./MyContext";
import { createAccessToken, createRefreshToken } from "./auth";
import { isAuth } from "./isAuth";
import { sendRefreshToken } from "./sendRefreshToken";
import { getConnection } from "typeorm";
import { verify } from "jsonwebtoken";
import { ApolloError } from "apollo-server-express";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
  //must explictly define type for graphql.
  @Field(() => User)
  user: User;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "Hello";
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    console.log(payload);
    return `your user id is: ${payload!.userId}`;
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() context: MyContext) {
    const authorization = context.req.headers["authorization"];
    //if the user did not pass in authorization inside the header, then deny access
    if (!authorization) {
      return null;
    }
    try {
      const token = authorization.split(" ")[1];
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return User.findOne(payload.userId);
    } catch (err) {
      console.log(err);
      return null;
    }
    return null;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, "");

    return true;
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Arg("userId", () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, "tokenVersion", 1);

    return true;
  }
  //Login returns an access token and also sends a refresh token as a cookie.
  //The client will send that access token to request resources from the server.
  //It sends it inside the headers on the 'authorization' property.
  //The value is a string: "bearer jwtjwtjwtblahrandomcode".
  //users use the access token to gain access to authorized routes.
  //The cookie is then used to refresh the Access token when it expires.
  //the access token is only good for 15min. The refresh for 7d. We can't make the user
  //sign in every 15 min.
  @Mutation(() => LoginResponse, { nullable: true })
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse | null> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new ApolloError("Invalid email");
      return null;
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      throw new Error("Incorrect password");
    }

    //login successful

    //res.cookie send refresh token in cookie/jid
    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user
    };
  }

  @Mutation(() => LoginResponse, { nullable: true })
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { req, res }: MyContext
  ): Promise<LoginResponse | null> {
    const hashedPassword = await hash(password, 12);

    try {
      await User.insert({
        email,
        password: hashedPassword
      });
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
    return this.login(email, password, { req, res });
  }
}
