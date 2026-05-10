import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { PermissionManager } from "../../utils/PermissionManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "tag",
  description: "Manages or displays tags.",
  usage:
    "!tag <name> | !tag add <name> <content> | !tag delete <name> | !tag list",
  category: "utility",
  requiredLevel: 0,
  aliases: ["t"],
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const subcommand = args[0]?.toLowerCase();
    const tagName = args[1]?.toLowerCase();

    if (subcommand === "add") {
      if (
        !(await PermissionManager.requireLevel(client, message.member!, 50))
      ) {
        return message.reply("You do not have permission to add tags.");
      }
      const content = args.slice(2).join(" ");
      if (!tagName || !content) {
        return message.reply(`Usage: !tag add <name> <content>`);
      }

      await client.db.tag.upsert({
        where: { guildId_name: { guildId: message.guildId!, name: tagName } },
        update: { content, userId: message.author.id },
        create: {
          guildId: message.guildId!,
          name: tagName,
          content,
          userId: message.author.id,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setDescription(`✅ Tag \`${tagName}\` has been saved.`);
      return message.reply({ embeds: [embed] });
    }

    if (subcommand === "delete") {
      if (!tagName) {
        return message.reply(`Usage: !tag delete <name>`);
      }

      const existingTag = await client.db.tag.findUnique({
        where: { guildId_name: { guildId: message.guild.id, name: tagName } },
      });

      if (!existingTag) return message.reply("Tag not found.");

      if (existingTag.userId !== message.author.id) {
        const level = await PermissionManager.getLevel(client, message.member!);
        if (level < 50)
          return message.reply("You can only delete your own tags.");
      }

      await client.db.tag.delete({
        where: { id: existingTag.id },
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setDescription(`✅ Tag \`${tagName}\` has been deleted.`);
      return message.reply({ embeds: [embed] });
    }

    if (subcommand === "list") {
      const tags = await client.db.tag.findMany({
        where: { guildId: message.guildId! },
      });
      if (tags.length === 0) {
        return message.reply("No tags found in this server.");
      }
      const embed = new EmbedBuilder()
        .setTitle("Available Tags")
        .setDescription(tags.map((t: any) => `\`${t.name}\``).join(", "))
        .setColor(Colors.INFO);
      return message.reply({ embeds: [embed] });
    }

    const nameToGet = subcommand;
    if (!nameToGet) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const tag = await client.db.tag.findUnique({
      where: { guildId_name: { guildId: message.guildId!, name: nameToGet } },
    });

    if (!tag) {
      return message.reply(`Tag \`${nameToGet}\` not found.`);
    }

    if (message.channel.isTextBased()) {
      await (message.channel as any).send(tag.content);
    }
  },
};

export default command;
