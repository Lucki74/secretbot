import { GuildMember } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { ConfigManager } from "./ConfigManager.js";

export class PermissionManager {
  public static async getLevel(
    client: SecretbotClient,
    member: GuildMember,
  ): Promise<number> {
    const staffIdsStr = process.env.STAFF_IDS || "";
    const staffIds = staffIdsStr.split(",").map((id) => id.trim());

    if (staffIds.includes(member.id)) {
      return 200;
    }

    if (member.id === member.guild.ownerId) {
      return 150;
    }

    const config = await ConfigManager.getGuildConfig(client, member.guild.id);
    let highestLevel = 0;

    if (config.levels && Array.isArray(config.levels)) {
      for (const rule of config.levels) {
        if (
          !rule ||
          typeof rule !== "object" ||
          !rule.id ||
          !rule.type ||
          typeof rule.level !== "number"
        ) {
          continue;
        }

        if (rule.type === "user" && member.id === rule.id) {
          if (rule.level > highestLevel) {
            highestLevel = rule.level;
          }
        } else if (rule.type === "role" && member.roles.cache.has(rule.id)) {
          if (rule.level > highestLevel) {
            highestLevel = rule.level;
          }
        }
      }
    }

    return highestLevel;
  }

  public static async requireLevel(
    client: SecretbotClient,
    member: GuildMember,
    level: number,
  ): Promise<boolean> {
    const userLevel = await this.getLevel(client, member);
    return userLevel >= level;
  }
}
