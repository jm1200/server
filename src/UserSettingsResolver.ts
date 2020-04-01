import {
  Resolver,
  Query,
  Mutation,
  Arg,
  UseMiddleware,
  Int
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "./isAuth";
import { UserSettings } from "./entity/UserSettings";

@Resolver()
export class UserSettingsResolver extends BaseEntity {
  @Query(() => UserSettings)
  @UseMiddleware(isAuth)
  getUserSettings(@Arg("userId", () => Int) userId: number) {
    return UserSettings.findOne(userId);
  }

  @Mutation(() => UserSettings, { nullable: true })
  @UseMiddleware(isAuth)
  async updateTheme(
    @Arg("theme") theme: string,
    @Arg("userId") userId: number
  ): Promise<UserSettings | null> {
    console.log("New Theme: ", theme);
    console.log("userId: ", userId);

    try {
      await UserSettings.update(userId, { theme });
      const userSettings = await UserSettings.findOne(userId);
      if (userSettings) {
        return userSettings;
      }
    } catch (err) {
      console.log("could not update user settings");
    }
    return null;
  }
}
