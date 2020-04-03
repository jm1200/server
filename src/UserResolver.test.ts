import { Connection } from "typeorm";

import { graphqlTestCall } from "./graphqlTestCall";
import { createTestConn } from "./createTestConn";
import { User } from "./entity/User";

const registerMutation = `
mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      accessToken
      user {
        id
        email
      }
      userSettings {
        theme
      }
    }
  }
`;

const loginMutation = `
mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        id
        email
      }
      userSettings {
        theme
      }
    }
  }
`;

const meQuery = `
query Me {
    me {
      user {
        email
        id
      }
      userSettings {
        theme
      }
    }
  }
`;

let conn: Connection;

beforeAll(async () => {
  conn = await createTestConn();
});

afterAll(async () => {
  await conn.close();
});

describe("resolvers", () => {
  it("register, login, and me", async () => {
    const testUser = { email: "bob@bob.com", password: "bobby" };

    const registerResponse = await graphqlTestCall(registerMutation, {
      email: testUser.email,
      password: testUser.password
    });

    expect(registerResponse!.data!.register.user).toEqual({
      id: 1,
      email: "bob@bob.com"
    });
    expect(registerResponse!.data!.register.userSettings).toEqual({
      theme: "dark"
    });
    expect(registerResponse!.data!.register.accessToken).toBeDefined();

    const dbUser = await User.findOne({ where: { email: testUser.email } });

    expect(dbUser).toBeDefined();

    const loginResponse = await graphqlTestCall(loginMutation, {
      email: testUser.email,
      password: testUser.password
    });

    expect(loginResponse!.data!.login.user).toEqual({
      id: dbUser!.id,
      email: dbUser!.email
    });
    expect(loginResponse!.data!.login.userSettings).toEqual({
      theme: "dark"
    });
    expect(loginResponse!.data!.login.accessToken).toBeDefined();

    let accessToken: string = loginResponse!.data!.login.accessToken;

    const meResponse = await graphqlTestCall(meQuery, {}, accessToken);

    expect(meResponse!.data!.me).toEqual({
      user: {
        id: dbUser!.id,
        email: dbUser!.email
      },
      userSettings: {
        theme: "dark"
      }
    });
  });
});
