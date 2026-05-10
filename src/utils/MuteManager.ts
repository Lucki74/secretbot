import { SecretbotClient } from "../SecretbotClient.js";
import { ConfigManager } from "./ConfigManager.js";

export class MuteManager {
  private client: SecretbotClient;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(client: SecretbotClient) {
    this.client = client;
  }

  public async loadPending() {
    const activeMutes = await this.client.db.mute.findMany({
      where: { active: true, expiresAt: { not: null } },
    });

    for (const mute of activeMutes) {
      this.scheduleUnmute(mute.guildId, mute.userId, mute.expiresAt!);
    }
  }

  public async scheduleUnmute(
    guildId: string,
    userId: string,
    expiresAt: Date,
  ) {
    const key = `${guildId}_${userId}`;
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    const delay = expiresAt.getTime() - Date.now();

    if (delay <= 0) {
      await this.unmute(guildId, userId);
    } else if (delay > 2147483647) {
      const timeout = setTimeout(() => {
        this.timeouts.delete(key);
        this.scheduleUnmute(guildId, userId, expiresAt);
      }, 2147483647);
      this.timeouts.set(key, timeout);
    } else {
      const timeout = setTimeout(() => this.unmute(guildId, userId), delay);
      this.timeouts.set(key, timeout);
    }
  }

  public cancelUnmute(guildId: string, userId: string) {
    const key = `${guildId}_${userId}`;
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }

  public async unmute(guildId: string, userId: string) {
    const key = `${guildId}_${userId}`;
    this.timeouts.delete(key);

    try {
      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      if (
        member.communicationDisabledUntilTimestamp &&
        member.communicationDisabledUntilTimestamp > Date.now()
      ) {
        await member.timeout(null, "Mute expired (persistent)");
      }

      const config = await ConfigManager.getGuildConfig(this.client, guildId);
      if (config.muteRoleId && member.roles.cache.has(config.muteRoleId)) {
        await member.roles.remove(
          config.muteRoleId,
          "Mute expired (persistent)",
        );
      }

      await this.client.db.mute.updateMany({
        where: { guildId, userId, active: true },
        data: { active: false },
      });
    } catch (error) {
      console.error(
        `Failed to automatically unmute user ${userId} in guild ${guildId}:`,
        error,
      );
    }
  }
}
