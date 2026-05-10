import { Message, EmbedBuilder, DiscordAPIError } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import { truncate } from "../../utils/EmbedUtils.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "search",
  description: "Searches for members based on various criteria.",
  usage:
    "!search [--username <text>] [--role <@role|id>] [--joined-before <date>] [--joined-after <date>] [--created-before <date>] [--created-after <date>] [--limit <number>]",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    let username = "";
    let roleId = "";
    let joinedBefore: number | null = null;
    let joinedAfter: number | null = null;
    let createdBefore: number | null = null;
    let createdAfter: number | null = null;
    let limit = 10;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "--username" && args[i + 1])
        username = args[++i]!.toLowerCase();
      else if (arg === "--role" && args[i + 1])
        roleId = args[++i]!.replace(/\D/g, "");
      else if (arg === "--joined-before" && args[i + 1])
        joinedBefore = new Date(args[++i]!).getTime();
      else if (arg === "--joined-after" && args[i + 1])
        joinedAfter = new Date(args[++i]!).getTime();
      else if (arg === "--created-before" && args[i + 1])
        createdBefore = new Date(args[++i]!).getTime();
      else if (arg === "--created-after" && args[i + 1])
        createdAfter = new Date(args[++i]!).getTime();
      else if (arg === "--limit" && args[i + 1])
        limit = Math.min(50, parseInt(args[++i]!, 10) || 10);
    }

    const msg = await message.reply("Fetching members...");
    const members = await message.guild.members.fetch();

    const filtered = members.filter((m) => {
      if (username && !m.user.username.toLowerCase().includes(username))
        return false;
      if (roleId && !m.roles.cache.has(roleId)) return false;
      if (joinedBefore && m.joinedTimestamp && m.joinedTimestamp > joinedBefore)
        return false;
      if (joinedAfter && m.joinedTimestamp && m.joinedTimestamp < joinedAfter)
        return false;
      if (createdBefore && m.user.createdTimestamp > createdBefore)
        return false;
      if (createdAfter && m.user.createdTimestamp < createdAfter) return false;
      return true;
    });

    const results = Array.from(filtered.values()).slice(0, limit);

    if (results.length === 0) {
      return msg.edit("No members found matching the criteria.");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Search Results (${filtered.size} total)`)
      .setColor(Colors.INFO);

    const desc = results
      .map((m) => {
        const joined = m.joinedAt
          ? `<t:${Math.floor(m.joinedAt.getTime() / 1000)}:d>`
          : "Unknown";
        return `**${m.user.username}** (\`${m.user.id}\`) | Joined: ${joined}`;
      })
      .join("\n");

    embed.setDescription(truncate(desc, 4096));

    await msg.edit({ content: "", embeds: [embed] });
  },
};

export default command;
