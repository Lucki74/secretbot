import { Message, DiscordAPIError } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { AutomodManager } from "../utils/AutomodManager.js";
import { ConfigManager } from "../utils/ConfigManager.js";
import { SlowmodeEnforcer } from "../utils/SlowmodeEnforcer.js";
import { PermissionManager } from "../utils/PermissionManager.js";
import type { BotCommand } from "../types/BotCommand.js";

const cooldowns = new Map<string, Map<string, number>>();

export default async (client: SecretbotClient, message: Message) => {
  if (message.author.bot) return;

  const slowmodeDeleted = await SlowmodeEnforcer.checkMessage(client, message);
  if (slowmodeDeleted) return;

  const automodActioned = await AutomodManager.check(client, message);
  if (automodActioned) return;

  if (message.guild) {
    const config = await ConfigManager.getGuildConfig(client, message.guild.id);

    const autoReact = config.autoReactions?.find(
      (ar: any) => ar.channelId === message.channel.id,
    );
    if (autoReact && Array.isArray(autoReact.reactions)) {
      for (const emoji of autoReact.reactions) {
        await message.react(emoji).catch(() => null);
      }
    }

    const autoDelete = config.autoDelete?.find(
      (ad: any) => ad.channelId === message.channel.id,
    );
    if (autoDelete && autoDelete.delay) {
      setTimeout(
        () => message.delete().catch(() => null),
        autoDelete.delay * 1000,
      );
    }
  }

  let prefix = "!";
  if (message.guild) {
    const config = await ConfigManager.getGuildConfig(client, message.guild.id);
    prefix = config.prefix || "!";
  }

  const botMentionPrefix = `<@${client.user?.id}>`;
  const botMentionNicknamePrefix = `<@!${client.user?.id}>`;

  let content = message.content.trim();
  let commandName: string | undefined;
  let args: string[] = [];
  let command: BotCommand | null = null;

  if (
    content.startsWith(botMentionPrefix) ||
    content.startsWith(botMentionNicknamePrefix)
  ) {
    const pfx = content.startsWith(botMentionPrefix)
      ? botMentionPrefix
      : botMentionNicknamePrefix;
    const remaining = content.slice(pfx.length).trim();
    const split = remaining.split(/ +/);
    const potentialName = split.shift()?.toLowerCase();

    if (potentialName) {
      const cmd = client.commands.get(potentialName);
      if (cmd && cmd.category === "owner") {
        command = cmd;
        commandName = potentialName;
        args = split;

        const staffIds = process.env.STAFF_IDS?.split(",") || [];
        if (!staffIds.includes(message.author.id)) return;
      }
    }
  }

  if (!command) {
    let prefixSearchContent = content;
    if (
      content.startsWith(botMentionPrefix) ||
      content.startsWith(botMentionNicknamePrefix)
    ) {
      const pfx = content.startsWith(botMentionPrefix)
        ? botMentionPrefix
        : botMentionNicknamePrefix;
      prefixSearchContent = content.slice(pfx.length).trim();
    }

    if (prefixSearchContent.startsWith(prefix)) {
      const remaining = prefixSearchContent.slice(prefix.length).trim();
      const split = remaining.split(/ +/);
      const potentialName = split.shift()?.toLowerCase();

      if (potentialName) {
        const cmd = client.commands.get(potentialName);
        if (cmd && cmd.category !== "owner") {
          command = cmd;
          commandName = potentialName;
          args = split;
        }
      }
    }
  }

  if (!command || !commandName) return;

  if (!message.guild && command.category !== "owner") {
    return;
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Map());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name)!;
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message
        .reply(
          `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`,
        )
        .then((m) => setTimeout(() => m.delete().catch(() => null), 5000));
    }
  }

  if (message.member) {
    const userLevel = await PermissionManager.getLevel(client, message.member);
    const requiredLevel = command.requiredLevel ?? 0;

    if (userLevel < requiredLevel) {
      return message.reply("You do not have permission.");
    }
  } else {
    const staffIds = process.env.STAFF_IDS?.split(",") || [];
    const requiredLevel = command.requiredLevel ?? 0;
    if (requiredLevel > 0 && !staffIds.includes(message.author.id)) {
      return message.reply("You do not have permission.");
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    await command.execute(client, message, args);
  } catch (error) {
    console.error(error);
    if (error instanceof DiscordAPIError) {
      if (error.code === 50013) {
        return message.reply(
          "I don't have the required permissions to do that.",
        );
      } else if (error.code === 10007) {
        return message.reply("That user is not in this server.");
      }
    }
    message.reply("There was an error trying to execute that command!");
  }
};
