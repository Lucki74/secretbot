import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { LogManager } from "../../utils/LogManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "warn",
  description: "Warns a user in the server.",
  usage: "!warn <@user|id> [reason]",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild || !message.member) return;

    if (!args[0]) {
      await message.reply(`Usage: ${command.usage}`);
      return;
    }

    const targetId = args[0].replace(/[<@!>]/g, "");
    const reason = args.slice(1).join(" ") || "No reason provided";

    const targetUser = await client.users.fetch(targetId).catch(() => null);
    if (!targetUser) {
      await message.reply("User not found.");
      return;
    }

    const caseData = await CaseManager.createCase(client, {
      guildId: message.guild.id,
      userId: targetId,
      modId: message.author.id,
      type: "warn",
      reason: reason,
    });

    const dmEmbed = new EmbedBuilder()
      .setColor(Colors.WARNING)
      .setTitle(`You have been warned in ${message.guild.name}`)
      .addFields({ name: "Reason", value: reason });
    await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(Colors.MOD_ACTION)
      .setDescription(
        `✅ Warned **${targetUser.username}** (Case #${caseData.caseNumber})\nReason: ${reason}`,
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await LogManager.log(client, message.guild.id, "mod_action", embed);
  },
};

export default command;
