import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { ConfigManager } from "../../utils/ConfigManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "pingable",
  description: "Makes a role mentionable for a specified duration.",
  usage: "!pingable <@role|id>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const role =
      message.mentions.roles.first() ||
      (args[0] ? message.guild.roles.cache.get(args[0]) : null);
    if (!role) return message.reply("Please provide a valid role.");

    const config = await ConfigManager.getGuildConfig(client, message.guild.id);
    const pingableConfig = config.pingableRoles?.find(
      (r: any) => r.roleId === role.id,
    );

    const timeout = (pingableConfig?.timeout || 60) * 1000;

    try {
      await role.setMentionable(true, `Made pingable by ${message.author.username}`);

      const embed = new EmbedBuilder()
        .setDescription(
          `Successfully made role **${role.name}** mentionable for ${timeout / 1000} seconds.`,
        )
        .setColor("#43B581");
      await message.reply({ embeds: [embed] });

      setTimeout(async () => {
        try {
          await role.setMentionable(false, "Pingable duration expired");
        } catch (e) {}
      }, timeout);
    } catch (e) {
      message.reply("Failed to update role. Check permissions and hierarchy.");
    }
  },
};

export default command;

