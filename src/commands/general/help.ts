import { Message, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const command: BotCommand = {
  name: "help",
  description:
    "Displays all available commands or info about a specific command.",
  usage: "!help [command]",
  category: "general",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const commandName = args[0]?.toLowerCase();

    if (commandName) {
      const targetCommand = client.commands.get(commandName);
      if (!targetCommand) return message.reply("Command not found.");

      const embed = new EmbedBuilder()
        .setTitle(`Help: !${targetCommand.name}`)
        .setDescription(targetCommand.description || "No description provided.")
        .addFields(
          {
            name: "Category",
            value: targetCommand.category || "General",
            inline: true,
          },
          {
            name: "Usage",
            value: `\`${targetCommand.usage || `!${targetCommand.name}`}\``,
            inline: true,
          },
        )
        .setColor(Colors.INFO);

      return message.reply({ embeds: [embed] });
    }

    const categories: Record<string, string[]> = {};
    client.commands.forEach((cmd: BotCommand) => {
      const cat = cmd.category || "General";
      if (!categories[cat]) categories[cat] = [];
      if (!categories[cat]!.includes(`\`${cmd.name}\``)) {
        categories[cat]!.push(`\`${cmd.name}\``);
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("Secretbot Help")
      .setDescription(
        "Use `!help <command>` for more information on a specific command.",
      )
      .setColor(Colors.INFO)
      .setThumbnail("attachment://secretbot.png");

    for (const [cat, cmds] of Object.entries(categories)) {
      if (cat === "owner") continue; 
      embed.addFields({ name: cat.toUpperCase(), value: cmds.join(", ") });
    }

    const logoPath = path.resolve(__dirname, "../../../secretbot.png");
    const attachment = new AttachmentBuilder(logoPath, {
      name: "secretbot.png",
    });
    message.reply({ embeds: [embed], files: [attachment] });
  },
};

export default command;
