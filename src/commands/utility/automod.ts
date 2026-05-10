import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { ConfigManager } from "../../utils/ConfigManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "automod",
  description: "Displays automod status and rules.",
  usage: "!automod <status|rules>",
  category: "utility",
  requiredLevel: 100,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const subCommand = args[0]?.toLowerCase();
    const config = await ConfigManager.getGuildConfig(client, message.guild.id);
    const automod = config.automod || { enabled: false, rules: [] };

    if (subCommand === "status") {
      const embed = new EmbedBuilder()
        .setTitle("Automod Status")
        .addFields(
          {
            name: "Enabled",
            value: automod.enabled ? "✅ Yes" : "❌ No",
            inline: true,
          },
          {
            name: "Rules Count",
            value: `${automod.rules?.length || 0}`,
            inline: true,
          },
          {
            name: "Spam Detection",
            value: automod.spam?.count
              ? `Enabled (${automod.spam.count} msgs / ${automod.spam.interval}s)`
              : "Disabled",
            inline: true,
          },
        )
        .setColor(Colors.INFO)
        .setTimestamp();
      await message.reply({ embeds: [embed] });
    } else if (subCommand === "rules") {
      const rules = automod.rules || [];
      if (rules.length === 0)
        return message.reply("No automod rules configured.");

      const embed = new EmbedBuilder()
        .setTitle("Automod Rules")
        .setDescription(
          rules
            .map(
              (r: any, i: number) =>
                `**${i + 1}.** \`${r.pattern}\` -> **${r.action}**`,
            )
            .join("\n"),
        )
        .setColor(Colors.INFO)
        .setTimestamp();
      await message.reply({ embeds: [embed] });
    } else {
      message.reply(`Usage: ${command.usage}`);
    }
  },
};

export default command;
