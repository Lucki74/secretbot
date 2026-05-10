import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { ConfigManager } from "../../utils/ConfigManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "rules",
  description: "Displays the server rules.",
  usage: "!rules [rule_number]",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const config = await ConfigManager.getGuildConfig(client, message.guild.id);
    const rules = config.rules || [];

    if (!Array.isArray(rules) || rules.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("No rules have been configured for this server.")
            .setColor("#FAA61A"),
        ],
      });
    }

    const ruleNumber = parseInt(args[0] || "");

    const embed = new EmbedBuilder()
      .setTitle(`${message.guild.name} Rules`)
      .setColor("#5865F2")
      .setTimestamp();

    if (!isNaN(ruleNumber)) {
      const rule = rules[ruleNumber - 1];
      if (!rule) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`Rule #${ruleNumber} not found.`)
              .setColor("#FAA61A"),
          ],
        });
      }
      embed.setDescription(`**Rule #${ruleNumber}:**\n${rule}`);
    } else {
      const desc = rules.map((r, i) => `**${i + 1}.** ${r}`).join("\n\n");
      embed.setDescription(desc.slice(0, 4096));
    }

    await message.reply({ embeds: [embed] });
  },
};

export default command;
