import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "emoji",
  description:
    "Displays information and high-resolution link for a custom emoji.",
  usage: "!emoji <custom_emoji>",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!args[0]) return message.reply("Please provide a custom emoji.");

    const emojiArg = args[0];
    const customEmojiMatch = emojiArg.match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/);

    if (!customEmojiMatch) {
      return message.reply("That doesn't look like a valid custom emoji.");
    }

    const isAnimated = Boolean(customEmojiMatch[1]);
    const emojiName = customEmojiMatch[2]!;
    const emojiId = customEmojiMatch[3]!;
    const ext = isAnimated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

    const embed = new EmbedBuilder()
      .setTitle(`Emoji Info: ${emojiName}`)
      .setColor("#5865F2")
      .setImage(url)
      .addFields(
        { name: "ID", value: emojiId, inline: true },
        { name: "Name", value: emojiName, inline: true },
        { name: "Animated", value: isAnimated ? "Yes" : "No", inline: true },
        { name: "Link", value: `[URL](${url})`, inline: true },
      );

    const createdTimestamp = (BigInt(emojiId) >> 22n) + 1420070400000n;
    embed.addFields({
      name: "Created At",
      value: `<t:${Math.floor(Number(createdTimestamp) / 1000)}:F>`,
      inline: true,
    });

    await message.reply({ embeds: [embed] });
  },
};

export default command;
