import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "bansearch",
  description: "Searches for a user in the server's ban list.",
  usage: "!bansearch <user|id>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;
    if (!args[0]) return message.reply("Please provide a username or user ID.");

    const query = args.join(" ").toLowerCase();

    const msg = await message.reply("Fetching bans...");
    const bans = await message.guild.bans.fetch();

    const matched = bans.filter(
      (b) =>
        b.user.id === query || b.user.username.toLowerCase().includes(query),
    );

    if (matched.size === 0) {
      return msg.edit("No matching bans found.");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Ban Search Results (${matched.size})`)
      .setColor("#5865F2");

    const desc = Array.from(matched.values())
      .slice(0, 20)
      .map(
        (b) =>
          `**${b.user.username}** (\`${b.user.id}\`) - Reason: ${b.reason || "None"}`,
      )
      .join("\n");

    embed.setDescription(desc || "No descriptions available.");

    await msg.edit({ content: "", embeds: [embed] });
  },
};

export default command;
