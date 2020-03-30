import "dotenv/config";
import "reflect-metadata";
import Express from "express";
import { ApolloServer } from "apollo-server-express";
import { UserResolver } from "./UserResolver";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./auth";
import { sendRefreshToken } from "./sendRefreshToken";
import cors from "cors";
import { FileUploadResolver } from "./FileUploadResolver";
//import { UserSettingsResolver } from "./UserSettingsResolver";

(async () => {
  const app = Express();

  //gives req.cookies
  app.use(cookieParser());
  app.use(
    cors({
      credentials: true,
      origin: "http://localhost:3000"
    })
  );

  app.get("/", (_, res) => {
    res.send("hello");
  });

  //seperate route for refresh token. Not a graphql function. Our cookie only works on this route.
  app.post("/refresh_token", async (req, res) => {
    //request from frontend or POSTMAN has cookie(jid) in header.
    //this cookie is the access token.
    const token = req.cookies.jid;

    //if no cookie/token deny access
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }

    //check if there is a valid refresh token, if not deny access
    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: "" });
    }
    console.log("PAYLOAD: ", payload);

    //a valid refresh token exists. There could only be a valid token
    //if the user has already had valid access token.
    //A refresh token payload={userId:id}

    const user = await User.findOne({ id: payload.userId });

    //if no user with that id, deny access
    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    //in the User Entity (database), each user has a token version that increments only
    //when an access token is sent ie. when the user logs in with password. if the TV in
    //the db does not equal the TV in the payload, deny access.
    if (user.tokenVersion !== payload.tokenVersion) {
      //token is invalid
      return res.send({ ok: false, accessToken: "" });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  await createConnection();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, FileUploadResolver]
    }),
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("Express server started at http://localhost:4000");
  });
})();
