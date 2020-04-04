import { createConnection } from "typeorm";

export const createTestConn = async () =>
  createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "server-boilerplate-test",
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: ["src/entity/**/*"]
  });

// class TestConnection {
//   connection: Promise<Connection>;
//   constructor() {
//     this.connection = createConnection({
//       type: "postgres",
//       host: "localhost",
//       port: 5432,
//       username: "postgres",
//       password: "postgres",
//       database: "server-boilerplate-test",
//       synchronize: true,
//       dropSchema: true,
//       logging: false,
//       entities: ["src/entity/**/*"]
//     });
//   }
// }

//export default new TestConnection();
