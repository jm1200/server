import { Connection } from "typeorm";

import { graphqlTestCall } from "./graphqlTestCall";
import { createTestConn } from "./createTestConn";
//import { User } from "./entity/User";

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

// const loginMutation = `
// mutation Login($email: String!, $password: String!) {
//     login(email: $email, password: $password) {
//       accessToken
//       user {
//         id
//         email
//       }
//       userSettings {
//         theme
//       }
//     }
//   }
// `;

// const meQuery = `
// query Me {
//     me {
//       user {
//         email
//         id
//       }
//       userSettings {
//         theme
//       }
//     }
//   }
// `;

let conn: Connection;

beforeAll(async () => {
  conn = await createTestConn();
});

afterAll(async () => {
  await conn.close();
});

describe("resolvers", () => {
  it("register, login, and me", async () => {
    console.log(process.env.ACCESS_TOKEN_SECRET);
    const testUser = { email: "bob@bob.com", password: "bobby" };

    const registerResponse = await graphqlTestCall(registerMutation, {
      email: testUser.email,
      password: testUser.password
    });
    console.log(registerResponse);
    if (registerResponse && registerResponse.data) {
      console.log(registerResponse.data.register.user);
    }

    expect(registerResponse!.data!.register.user).toEqual({
      id: 1,
      email: "bob@bob.com"
    });

    //   const dbUser = await User.findOne({ where: { email: testUser.email } });

    //   expect(dbUser).toBeDefined();

    //   const loginResponse = await graphqlTestCall(loginMutation, {
    //     email: testUser.email,
    //     password: testUser.password
    //   });

    //   expect(loginResponse).toEqual({
    //     data: {
    //       login: {
    //         id: `${dbUser!.id}`,
    //         email: dbUser!.email,

    //       }
    //     }
    //   });

    //   const meResponse = await graphqlTestCall(meQuery, {}, dbUser!.id);

    //   expect(meResponse).toEqual({
    //     data: {
    //       me: {
    //         id: `${dbUser!.id}`,
    //         email: dbUser!.email,

    //       }
    //     }
    //   });
  });
});
