import { graphql } from "graphql";
import { buildSchema } from "type-graphql";
import { FileUploadResolver } from "./FileUploadResolver";
import { UserSettingsResolver } from "./UserSettingsResolver";
import { UserResolver } from "./UserResolver";

export const graphqlTestCall = async (
  query: any,
  variables?: any,
  userId?: number | string
) => {
  const schema = await buildSchema({
    resolvers: [UserResolver, FileUploadResolver, UserSettingsResolver]
  });
  return graphql(
    schema,
    query,
    undefined,

    {
      req: {
        session: {
          userId
        }
      },
      res: {
        cookie: () => {}
      }
    },
    variables
  );
};
