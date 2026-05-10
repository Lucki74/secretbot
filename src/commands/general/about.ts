import { Message, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const command: BotCommand = {
  name: "about",
  description: "Displays information about Secretbot.",
  usage: "!about",
  category: "general",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const uptime = Date.now() - client.startupAt;
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);

    const embed = new EmbedBuilder()
      .setTitle("About Secretbot")
      .setDescription(
        "Secretbot is a highly advanced, open-source moderation bot built for large communities, inspired by Zeppelin.",
      )
      .addFields(
        {
          name: "Uptime",
          value: `${days}d ${hours}h ${minutes}m`,
          inline: true,
        },
        { name: "Guilds", value: `${client.guilds.cache.size}`, inline: true },
        { name: "Latency", value: `${client.ws.ping}ms`, inline: true },
      )
      .setThumbnail("attachment://secretbot.png")
      .setColor(Colors.INFO);

    const logoPath = path.resolve(__dirname, "../../../secretbot.png");
    const attachment = new AttachmentBuilder(logoPath, {
      name: "secretbot.png",
    });
    message.reply({ embeds: [embed], files: [attachment] });
  },
};

export default command;
