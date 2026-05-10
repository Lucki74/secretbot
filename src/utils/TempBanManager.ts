import { SecretbotClient } from "../SecretbotClient.js";

export class TempBanManager {
  private client: SecretbotClient;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(client: SecretbotClient) {
    this.client = client;
  }

  public async loadPending() {
    const activeBans = await this.client.db.tempBan.findMany({
      where: { active: true },
    });

    for (const ban of activeBans) {
      this.scheduleUnban(ban.guildId, ban.userId, ban.expiresAt);
    }
  }

  public scheduleUnban(guildId: string, userId: string, expiresAt: Date) {
    const key = `${guildId}_${userId}`;
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    const delay = expiresAt.getTime() - Date.now();

    if (delay <= 0) {
      this.unban(guildId, userId);
    } else {
      const timeout = setTimeout(() => this.unban(guildId, userId), delay);
      this.timeouts.set(key, timeout);
    }
  }

  public async cancelTempBan(guildId: string, userId: string) {
    const key = `${guildId}_${userId}`;
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    await this.client.db.tempBan.updateMany({
        where: { guildId, userId, active: true },
        data: { active: false }
    });
  }

  public async unban(guildId: string, userId: string) {
    const key = `${guildId}_${userId}`;
    this.timeouts.delete(key);

    try {
      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const ban = await guild.bans.fetch(userId).catch(() => null);
      if (ban) {
        await guild.bans.remove(userId, "Tempban expired");
      }

      await this.client.db.tempBan.updateMany({
        where: { guildId, userId, active: true },
        data: { active: false },
      });

    } catch (error) {
      console.error(`Failed to automatically unban user ${userId} in guild ${guildId}:`, error);
    }
  }
}
