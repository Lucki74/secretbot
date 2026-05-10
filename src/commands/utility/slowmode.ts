import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { parseDuration } from "../../utils/TimeUtils.js";
import { Colors } from "../../utils/Colors.js";
import { LogManager } from "../../utils/LogManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "slowmode",
  description: "Configures slowmode for a channel.",
  usage: "!slowmode <#channel|here> <duration|off>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild || !message.member) return;

    if (!args[0]) {
      await message.reply(`Usage: ${command.usage}`);
      return;
    }
    let targetChannel = message.channel;
    let durationArg = args[1];

    if (args[0].toLowerCase() !== "here") {
      const channelId = args[0].replace(/[<#>]/g, "");
      const channel = message.guild.channels.cache.get(channelId);
      if (
        channel &&
        channel.isTextBased() &&
        "setRateLimitPerUser" in channel
      ) {
        targetChannel = channel;
      } else {
        durationArg = args[0];
      }
    }

    if (!durationArg) {
      await message.reply('Please specify a duration or "off".');
      return;
    }

    if (durationArg.toLowerCase() === "off") {
      if ("setRateLimitPerUser" in targetChannel) {
        await (targetChannel as any).setRateLimitPerUser(0);
      }
      await client.db.slowmode.deleteMany({
        where: {
          guildId: message.guild.id,
          channelId: targetChannel.id,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setDescription(
          `✅ Slowmode has been disabled for <#${targetChannel.id}>.`,
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      await LogManager.log(client, message.guild.id, "slowmode_update", embed);
      return;
    }

    const durationMs = parseDuration(durationArg);
    if (!durationMs) {
      await message.reply("Invalid duration format (e.g. 10s, 5m, 12h).");
      return;
    }

    const durationSeconds = Math.floor(durationMs / 1000);

    if (durationSeconds <= 21600) {
      if ("setRateLimitPerUser" in targetChannel) {
        await (targetChannel as any).setRateLimitPerUser(durationSeconds);
      }
      await client.db.slowmode.deleteMany({
        where: {
          guildId: message.guild.id,
          channelId: targetChannel.id,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setDescription(
          `✅ Native slowmode set to **${durationSeconds} seconds** in <#${targetChannel.id}>.`,
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      await LogManager.log(client, message.guild.id, "slowmode_update", embed);
    } else {
      if ("setRateLimitPerUser" in targetChannel) {
        await (targetChannel as any).setRateLimitPerUser(0); 
      }

      await client.db.slowmode.upsert({
        where: {
          guildId_channelId: {
            guildId: message.guild.id,
            channelId: targetChannel.id,
          },
        },
        update: {
          seconds: durationSeconds,
        },
        create: {
          guildId: message.guild.id,
          channelId: targetChannel.id,
          seconds: durationSeconds,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setDescription(
          `✅ Bot-managed slowmode set to **${durationSeconds} seconds** in <#${targetChannel.id}>.`,
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      await LogManager.log(client, message.guild.id, "slowmode_update", embed);
    }
  },
};

export default command;
