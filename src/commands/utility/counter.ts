import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { PermissionManager } from "../../utils/PermissionManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "counter",
  description: "Manages server counters.",
  usage: "!counter <get|set|add|reset> <name> [value]",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const subCommand = args[0]?.toLowerCase();
    const counterName = args[1]?.toLowerCase();

    if (!subCommand || !counterName) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`Usage: ${command.usage}`)
            .setColor("#FAA61A"),
        ],
      });
    }

    const userLevel = await PermissionManager.getLevel(client, message.member!);

    if (subCommand === "get") {
      const counter = await client.db.counter.findUnique({
        where: {
          guildId_name: { guildId: message.guild.id, name: counterName },
        },
      });
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `Counter **${counterName}** is currently at: **${counter?.value || 0}**`,
            )
            .setColor("#5865F2"),
        ],
      });
    }

    if (userLevel < 100) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "You do not have permission to modify counters (level 100 required).",
            )
            .setColor("#FAA61A"),
        ],
      });
    }

    if (subCommand === "set") {
      const value = parseInt(args[2] || "");
      if (isNaN(value)) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("Please provide a valid number.")
              .setColor("#FAA61A"),
          ],
        });
      }

      await client.db.counter.upsert({
        where: {
          guildId_name: { guildId: message.guild.id, name: counterName },
        },
        update: { value },
        create: { guildId: message.guild.id, name: counterName, value },
      });
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `✅ Counter **${counterName}** set to **${value}**.\n`,
            )
            .setColor("#43B581"),
        ],
      });
    }

    if (subCommand === "add") {
      const amount = parseInt(args[2] || "1");
      if (isNaN(amount)) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription("Please provide a valid number.")
              .setColor("#FAA61A"),
          ],
        });
      }

      const counter = await client.db.counter.upsert({
        where: {
          guildId_name: { guildId: message.guild.id, name: counterName },
        },
        update: { value: { increment: amount } },
        create: { guildId: message.guild.id, name: counterName, value: amount },
      });
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `✅ Counter **${counterName}** is now at **${counter.value}**.`,
            )
            .setColor("#43B581"),
        ],
      });
    }

    if (subCommand === "reset") {
      await client.db.counter.upsert({
        where: {
          guildId_name: { guildId: message.guild.id, name: counterName },
        },
        update: { value: 0 },
        create: { guildId: message.guild.id, name: counterName, value: 0 },
      });
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `✅ Counter **${counterName}** has been reset to **0**.`,
            )
            .setColor("#43B581"),
        ],
      });
    }

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`Unknown sub-command. Usage: ${command.usage}`)
          .setColor("#FAA61A"),
      ],
    });
  },
};

export default command;
