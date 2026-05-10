import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "namehistory",
  description: "Displays the username and nickname history for a user.",
  usage: "!namehistory <@user|id>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const target =
      message.mentions.users.first() ||
      (args[0]
        ? await client.users.fetch(args[0]).catch(() => null)
        : message.author);
    if (!target) return message.reply("Please provide a valid user.");

    const history = await client.db.nameHistory.findMany({
      where: { userId: target.id },
      orderBy: { recordedAt: "desc" },
      take: 20,
    });

    if (history.length === 0)
      return message.reply(`No name history found for **${target.username}**.`);

    const embed = new EmbedBuilder()
      .setTitle(`Name History for ${target.username}`)
      .setDescription(
        history
          .map(
            (h: any) =>
              `**${h.username}** ${h.nickname ? `(Nick: ${h.nickname})` : ""} | <t:${Math.floor(h.recordedAt.getTime() / 1000)}:F>`,
          )
          .join("\n"),
      )
      .setColor("#5865F2")
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;

