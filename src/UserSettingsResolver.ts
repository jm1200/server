import { Resolver, Query, Arg, Mutation } from "type-graphql";
import { UserSettings } from "./entity/UserSettings";

@Resolver()
export class UserSettingsResolver {
  @Query(() => UserSettings)
  async getUserSettings(@Arg("userId") userId: number): Promise<UserSettings> {
    const userSetting = await UserSettings.findOne(userId);
    return userSetting!;
  }

  @Mutation(() => Boolean)
  async updateTheme(
    @Arg("userId") userId: number,
    @Arg("theme") theme: string
  ): Promise<Boolean> {
    try {
      await UserSettings.update(userId, { theme });
      const userSettings = await UserSettings.findOne(userId);

      console.log("userSettings update", userSettings);
      return true;
    } catch (err) {
      console.log("could not update user setting", err);
      return false;
    }
  }
}
