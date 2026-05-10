import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";
import { Colors } from "../utils/Colors.js";
import { truncate } from "../utils/EmbedUtils.js";

export default async (client: SecretbotClient, message: Message) => {
  if (message.partial) {
    try {
      await message.fetch();
    } catch {
      return;
    }
  }

  if (message.author?.bot || !message.guild) return;

  const embed = new EmbedBuilder()
    .setTitle("Message Deleted")
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL(),
    })
    .addFields(
      { name: "Channel", value: `${message.channel}`, inline: true },
      {
        name: "Content",
        value: truncate(message.content || "*No content*", 1024),
      },
    )
    .setFooter({ text: `User ID: ${message.author.id}` })
    .setTimestamp()
    .setColor(Colors.MSG_DELETE);

  await LogManager.log(client, message.guild.id, "message_delete", embed);
};
