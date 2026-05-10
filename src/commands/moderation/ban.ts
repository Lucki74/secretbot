import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "ban",
  description: "Bans a user from the server.",
  usage: "!ban <@user|id> [reason]",
  category: "moderation",
  requiredLevel: 75,
  aliases: ["permban"],
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;
    const target =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("Please provide a valid user.");

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target
        .send(`You have been banned from **${message.guild.name}**: ${reason}`)
        .catch(() => null);
      await message.guild.members.ban(target, { reason });
      const newCase = await CaseManager.createCase(client, {
        guildId: message.guild.id,
        userId: target.id,
        modId: message.author.id,
        type: "ban",
        reason,
      });

      const embed = new EmbedBuilder()
        .setDescription(
          `✅ Banned **${target.username}** (Case #${newCase.caseNumber})\nReason: ${reason}`,
        )
        .setColor(Colors.MOD_ACTION)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      message.reply("Failed to ban the user. Check my permissions.");
    }
  },
};

export default command;
