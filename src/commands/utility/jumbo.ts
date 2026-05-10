import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "jumbo",
  description: "Enlarges an emoji.",
  usage: "!jumbo <emoji>",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!args[0]) {
      return message.reply("Please provide an emoji.");
    }

    const emojiArg = args[0];
    const customEmojiMatch = emojiArg.match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/);

    let url = "";

    if (customEmojiMatch) {
      const isAnimated = Boolean(customEmojiMatch[1]);
      const emojiId = customEmojiMatch[3];
      const ext = isAnimated ? "gif" : "png";
      url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;
    } else {
      url = `https://emojicdn.elk.sh/${encodeURIComponent(emojiArg)}?style=twitter`;
    }

    const embed = new EmbedBuilder().setImage(url).setColor("#5865F2");

    await message.reply({ embeds: [embed] }).catch(() => {
      message.reply(
        "Could not enlarge that emoji. Make sure it's a valid emoji.",
      );
    });
  },
};

export default command;
