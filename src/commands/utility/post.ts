import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "post",
  description: "Posts or edits a message as the bot in a target channel.",
  usage:
    "!post <#channel|id> <message> | !post edit <message_id> <#channel|id> <new_content>",
  category: "utility",
  requiredLevel: 100,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    if (args[0]?.toLowerCase() === "edit") {
      const messageId = args[1];
      const channelMention =
        message.mentions.channels.first() ||
        (args[2] ? message.guild.channels.cache.get(args[2]) : null);
      const newContent = args.slice(channelMention ? 3 : 2).join(" ");

      if (!messageId || !newContent)
        return message.reply(
          "Usage: !post edit <message_id> <#channel|id> <new_content>",
        );

      const channel =
        (channelMention as TextChannel) || (message.channel as TextChannel);
      try {
        const targetMsg = await channel.messages.fetch(messageId);
        await targetMsg.edit(newContent);
        const embed = new EmbedBuilder()
          .setDescription("✅ Message edited.")
          .setColor("#43B581");
        await message.reply({ embeds: [embed] });
      } catch (e) {
        message.reply("Failed to edit message. Is it mine? Is the ID correct?");
      }
      return;
    }

    const channelMention =
      message.mentions.channels.first() ||
      (args[0] ? message.guild.channels.cache.get(args[0]) : null);
    const content = args.slice(channelMention ? 1 : 0).join(" ");

    if (!content) return message.reply(`Usage: ${command.usage}`);

    const channel =
      (channelMention as TextChannel) || (message.channel as TextChannel);
    try {
      await channel.send(content);
      if (channel.id !== message.channel.id) {
        const embed = new EmbedBuilder()
          .setDescription(`✅ Message sent to <#${channel.id}>.`)
          .setColor("#43B581");
        await message.reply({ embeds: [embed] });
      }
    } catch (e) {
      message.reply("Failed to send message. Check permissions.");
    }
  },
};

export default command;
