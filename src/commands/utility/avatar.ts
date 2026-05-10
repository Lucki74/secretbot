import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "avatar",
  description: "Displays the avatar of a user.",
  usage: "!avatar [user]",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    let targetId = message.author.id;
    if (args.length > 0) {
      targetId = args[0]!.replace(/\D/g, "");
    }

    const user = await client.users.fetch(targetId).catch(() => message.author);

    const avatarUrl = user.displayAvatarURL({ size: 4096 });
    const isAnimated = avatarUrl.includes(".gif");

    const png = user.displayAvatarURL({ extension: "png", size: 4096 });
    const jpg = user.displayAvatarURL({ extension: "jpg", size: 4096 });
    const webp = user.displayAvatarURL({ extension: "webp", size: 4096 });

    let links = `[PNG](${png}) | [JPG](${jpg}) | [WEBP](${webp})`;
    if (isAnimated) {
      const gif = user.displayAvatarURL({ extension: "gif", size: 4096 });
      links += ` | [GIF](${gif})`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setDescription(`Links: ${links}`)
      .setImage(avatarUrl)
      .setColor("#5865F2");

    await message.reply({ embeds: [embed] });
  },
};

export default command;
