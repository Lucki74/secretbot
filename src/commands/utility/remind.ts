import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { parseDuration } from "../../utils/TimeUtils.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "remind",
  description: "Sets a reminder for yourself.",
  usage: "!remind <time> <content>",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) {
      return message.reply("Reminders can only be set inside a server.");
    }

    const timeStr = args[0];
    const reminder = args.slice(1).join(" ");

    if (!timeStr || !reminder) {
      return message.reply(
        "Usage: !remind <time> <content> (e.g. !remind 10m buy milk)",
      );
    }

    const duration = parseDuration(timeStr);
    if (!duration)
      return message.reply("Invalid time format. Use s, m, h, d, w, mo, y.");

    const remindAt = new Date(Date.now() + duration);

    await client.reminderScheduler.schedule(
      message.guildId!,
      message.author.id,
      message.channelId,
      reminder,
      remindAt,
    );

    const embed = new EmbedBuilder()
      .setColor("#43B581")
      .setDescription(
        `Okay, I will remind you in ${timeStr} (<t:${Math.floor(remindAt.getTime() / 1000)}:R>): "${reminder}"`,
      );

    message.reply({ embeds: [embed] });
  },
};

export default command;
