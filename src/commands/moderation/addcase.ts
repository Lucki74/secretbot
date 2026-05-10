import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "addcase",
  description: "Adds a note case for a user.",
  usage: "!addcase <@user|id> [reason/notes]",
  category: "moderation",
  requiredLevel: 50,
  aliases: ["note"],
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild || !message.member) return;

    if (!args[0]) {
      await message.reply("Usage: !addcase <@user|id> [reason/notes]");
      return;
    }

    const targetId = args[0].replace(/[<@!>]/g, "");
    const reason = args.slice(1).join(" ") || "No note provided";

    const targetUser = await client.users.fetch(targetId).catch(() => null);
    if (!targetUser) {
      return message.reply("User not found.");
    }

    const caseData = await CaseManager.createCase(client, {
      guildId: message.guild.id,
      userId: targetId,
      modId: message.author.id,
      type: "note",
      reason: reason,
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setDescription(
        `✅ Added note for **${targetUser.username}** (Case #${caseData.caseNumber})\nNote: ${reason}`,
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
