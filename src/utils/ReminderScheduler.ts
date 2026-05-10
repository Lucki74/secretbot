import { TextChannel } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";

export class ReminderScheduler {
  private client: SecretbotClient;
  private timeouts: Map<number, NodeJS.Timeout> = new Map();

  constructor(client: SecretbotClient) {
    this.client = client;
  }

  public async loadPending() {
    const reminders = await this.client.db.reminder.findMany();
    const now = new Date();

    for (const reminder of reminders) {
      if (reminder.remindAt <= now) {
        await this.fire(reminder);
      } else {
        this.scheduleTimeout(reminder);
      }
    }
  }

  public async schedule(
    guildId: string,
    userId: string,
    channelId: string,
    content: string,
    remindAt: Date,
  ) {
    await this.client.db.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    await this.client.db.guild.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId },
    });

    const reminder = await this.client.db.reminder.create({
      data: {
        guildId,
        userId,
        channelId,
        content,
        remindAt,
      },
    });

    this.scheduleTimeout(reminder);
  }

  private scheduleTimeout(reminder: any) {
    const now = new Date().getTime();
    const remindAt = new Date(reminder.remindAt).getTime();
    const delay = Math.max(0, remindAt - now);

    if (delay > 2147483647) {
      const timeout = setTimeout(() => {
        this.timeouts.delete(reminder.id);
        this.scheduleTimeout(reminder);
      }, 2147483647);
      this.timeouts.set(reminder.id, timeout);
    } else {
      const timeout = setTimeout(() => {
        this.timeouts.delete(reminder.id);
        this.fire(reminder);
      }, delay);
      this.timeouts.set(reminder.id, timeout);
    }
  }

  private async fire(reminder: any) {
    try {
      const user = await this.client.users
        .fetch(reminder.userId)
        .catch(() => null);
      if (user) {
        await user.send(`Reminder: ${reminder.content}`).catch(() => null);
      }

      const channel = await this.client.channels
        .fetch(reminder.channelId)
        .catch(() => null);
      if (channel instanceof TextChannel) {
        await channel
          .send(
            `<@${reminder.userId}>, here is your reminder: ${reminder.content}`,
          )
          .catch(() => null);
      }
    } catch (error) {
      console.error(`Failed to fire reminder ${reminder.id}:`, error);
    } finally {
      await this.client.db.reminder
        .delete({
          where: { id: reminder.id },
        })
        .catch(() => null);
    }
  }
}
