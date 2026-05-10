import { Message, EmbedBuilder, TextChannel, Collection } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "clean",
  description: "Bulk deletes messages with optional filters.",
  usage: "!clean <count> [flags]",
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

    const count = parseInt(args[0], 10);
    if (isNaN(count) || count <= 0) {
      await message.reply("Please provide a valid count.");
      return;
    }

    let targetChannel: TextChannel = message.channel as TextChannel;
    let targetUserId: string | null = null;
    let botsOnly = false;
    let matchText: string | null = null;
    let regexPattern: RegExp | null = null;
    let includePinned = false;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;
      const flag = arg.toLowerCase();
      if (flag === "-user" && args[i + 1]) {
        targetUserId = args[i + 1]!.replace(/[<@!>]/g, "");
        i++;
      } else if (flag === "-bots") {
        botsOnly = true;
      } else if (flag === "-match" && args[i + 1]) {
        matchText = args[i + 1]!;
        i++;
      } else if (flag === "-regex" && args[i + 1]) {
        try {
          regexPattern = new RegExp(args[i + 1]!, "i");
        } catch {
          await message.reply("Invalid regex pattern.");
          return;
        }
        i++;
      } else if (flag === "-channel" && args[i + 1]) {
        const channelId = args[i + 1]!.replace(/[<#>]/g, "");
        const channel = message.guild.channels.cache.get(channelId);
        if (channel instanceof TextChannel) {
          targetChannel = channel;
        }
        i++;
      } else if (flag === "-pinned") {
        includePinned = true;
      }
    }

    let remaining = count;
    let deletedCount = 0;
    let lastMessageId: string | undefined = undefined;

    const hasFilters = targetUserId || botsOnly || matchText || regexPattern;

    try {
      while (remaining > 0) {
        const fetchOptions: any = { limit: 100 };
        if (lastMessageId) fetchOptions.before = lastMessageId;

        const fetchedMessages =
          await targetChannel.messages.fetch(fetchOptions);
        if (
          !(fetchedMessages instanceof Collection) ||
          fetchedMessages.size === 0
        )
          break;

        lastMessageId = fetchedMessages.last()?.id;

        let toDelete: Collection<string, Message> = fetchedMessages;

        if (hasFilters) {
          toDelete = fetchedMessages.filter((m: Message) => {
            if (targetUserId && m.author.id !== targetUserId) return false;
            if (botsOnly && !m.author.bot) return false;
            if (matchText && !m.content.includes(matchText)) return false;
            if (regexPattern && !regexPattern.test(m.content)) return false;
            return true;
          });
        }

        const deleteArray = Array.from(toDelete.values())
          .filter((m) => includePinned || !m.pinned)
          .slice(0, remaining);

        if (deleteArray.length > 0) {
          const deleted = await targetChannel.bulkDelete(deleteArray, true);
          deletedCount += deleted.size;
          remaining -= deleted.size;
        }

        if (fetchedMessages.size < 100) {
          break;
        }
      }

      if (message.channel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setDescription(`Successfully deleted **${deletedCount}** messages.`)
          .setColor("#43B581");
        const sent = await (message.channel as any).send({ embeds: [embed] });
        setTimeout(() => sent.delete().catch(() => null), 5000);
      }

      if (message.channel.id === targetChannel.id && message.deletable) {
        await message.delete().catch(() => null);
      }
    } catch (error) {
      console.error(error);
      await message.reply(
        "Failed to clean messages. They might be older than 14 days or I lack permissions.",
      );
    }
  },
};

export default command;
