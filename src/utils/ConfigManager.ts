import * as yaml from "yaml";
import { SecretbotClient } from "../SecretbotClient.js";
import type { GuildConfig } from "../types/GuildConfig.js";

export class ConfigManager {
  private static cache = new Map<
    string,
    { config: GuildConfig; cachedAt: number }
  >();
  private static TTL = 60 * 1000; 

  public static async getGuildConfig(
    client: SecretbotClient,
    guildId: string,
  ): Promise<GuildConfig> {
    const now = Date.now();
    const cached = this.cache.get(guildId);

    if (cached && now - cached.cachedAt < this.TTL) {
      return cached.config;
    }

    const guild = await client.db.guild.findUnique({
      where: { id: guildId },
    });

    let config: GuildConfig;
    if (!guild || !guild.config) {
      config = this.getDefaultConfig();
    } else {
      try {
        config = yaml.parse(guild.config) || this.getDefaultConfig();
      } catch (e) {
        console.error(`Error parsing config for guild ${guildId}:`, e);
        config = this.getDefaultConfig();
      }
    }

    this.cache.set(guildId, { config, cachedAt: now });
    return config;
  }

  public static invalidate(guildId: string) {
    this.cache.delete(guildId);
  }

  private static getDefaultConfig(): GuildConfig {
    return {
      prefix: "!",
      plugins: {
        moderation: { enabled: true },
        utility: { enabled: true },
        logging: { enabled: true },
        automod: { enabled: true },
      },
      automod: {
        enabled: true,
        mentionSpam: { max: 5 },
        capsFilter: { percentage: 70, action: "delete" },
        antiInvite: { enabled: false, action: "delete" },
      },
    };
  }
}
