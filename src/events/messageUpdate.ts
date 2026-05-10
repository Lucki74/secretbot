import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";
import { Colors } from "../utils/Colors.js";
import { truncate } from "../utils/EmbedUtils.js";

export default async (
  client: SecretbotClient,
  oldMessage: Message,
  newMessage: Message,
) => {
  if (oldMessage.partial) {
    try {
      oldMessage = await oldMessage.fetch();
    } catch {
      return;
    }
  }
  if (newMessage.partial) {
    try {
      newMessage = await newMessage.fetch();
    } catch {
      return;
    }
  }

  if (oldMessage.author?.bot || !oldMessage.guild) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = new EmbedBuilder()
    .setTitle("Message Edited")
    .setAuthor({
      name: oldMessage.author.username,
      iconURL: oldMessage.author.displayAvatarURL(),
    })
    .addFields(
      { name: "Channel", value: `${oldMessage.channel}`, inline: true },
      {
        name: "Before",
        value: truncate(oldMessage.content || "*Empty*", 1024),
      },
      { name: "After", value: truncate(newMessage.content || "*Empty*", 1024) },
    )
    .setFooter({ text: `User ID: ${oldMessage.author.id}` })
    .setTimestamp()
    .setColor(Colors.MSG_EDIT);

  await LogManager.log(client, oldMessage.guild.id, "message_edit", embed);
};
