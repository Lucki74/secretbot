import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { Colors } from "../../utils/Colors.js";
import { LogManager } from "../../utils/LogManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "unmute",
  description: "Unmutes a user in the server.",
  usage: "!unmute <@user|id> [reason]",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;
    const target =
      message.mentions.members?.first() ||
      (args[0]
        ? await message.guild.members.fetch(args[0]).catch(() => null)
        : null);
    if (!target)
      return message.reply("Please provide a valid user in the server.");

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      if (
        target.communicationDisabledUntilTimestamp &&
        target.communicationDisabledUntilTimestamp > Date.now()
      ) {
        await target.timeout(null, reason);
      }

      await client.db.mute.updateMany({
        where: { guildId: message.guild.id, userId: target.id, active: true },
        data: { active: false },
      });

      client.muteManager.cancelUnmute(message.guild.id, target.id);

      const newCase = await CaseManager.createCase(client, {
        guildId: message.guild.id,
        userId: target.id,
        modId: message.author.id,
        type: "unmute",
        reason,
      });

      const embed = new EmbedBuilder()
        .setDescription(
          `✅ Unmuted **${target.user.username}** (Case #${newCase.caseNumber})\nReason: ${reason}`,
        )
        .setColor(Colors.SUCCESS)
        .setTimestamp();

      message.reply({ embeds: [embed] });
      await LogManager.log(client, message.guild.id, "mod_action", embed);
    } catch (e) {
      console.error(e);
      message.reply("Failed to unmute the user.");
    }
  },
};

export default command;
