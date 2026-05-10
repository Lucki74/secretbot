import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { LogManager } from "../../utils/LogManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "nick",
  description: "Changes or resets a user's nickname.",
  usage: "!nick <user> <new_nickname> or !nick reset <user>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    if (!args[0]) return message.reply(`Usage: ${command.usage}`);

    let isReset = false;
    let targetId = "";
    let newNick = "";

    if (args[0].toLowerCase() === "reset") {
      isReset = true;
      if (!args[1])
        return message.reply("Please provide a user to reset the nickname.");
      targetId = args[1].replace(/\D/g, "");
    } else {
      targetId = args[0].replace(/\D/g, "");
      newNick = args.slice(1).join(" ");
      if (!newNick) return message.reply("Please provide a new nickname.");
    }

    const member = await message.guild.members
      .fetch(targetId)
      .catch(() => null);
    if (!member) return message.reply("Member not found.");

    if (!message.guild.members.me?.permissions.has("ManageNicknames")) {
      return message.reply("I don't have the Manage Nicknames permission.");
    }

    const oldNick = member.nickname || member.user.username;

    try {
      if (isReset) {
        await member.setNickname(
          null,
          `Nickname reset by ${message.author.username}`,
        );
        await message.reply(
          `✅ Reset nickname for **${member.user.username}**.`,
        );
      } else {
        await member.setNickname(
          newNick,
          `Nickname changed by ${message.author.username}`,
        );
        await message.reply(
          `✅ Changed nickname for **${member.user.username}** to **${newNick}**.`,
        );
      }

      const logEmbed = new EmbedBuilder()
        .setTitle("Nickname Changed")
        .setDescription(
          `**User:** ${member.user.username} (${member.id})\n**Moderator:** ${message.author.username} (${message.author.id})`,
        )
        .addFields(
          { name: "Old Nickname", value: oldNick, inline: true },
          {
            name: "New Nickname",
            value: isReset ? member.user.username : newNick,
            inline: true,
          },
        )
        .setColor("#5865F2")
        .setTimestamp();

      await LogManager.log(
        client,
        message.guild.id,
        "nickname_change",
        logEmbed,
      );
    } catch (e) {
      message.reply(
        "Failed to change nickname. Make sure my role is higher than the user's role.",
      );
    }
  },
};

export default command;

