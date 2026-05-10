import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "add_dashboard_user",
  description: "Grants dashboard access to a user for a specific guild.",
  usage: "!add_dashboard_user <guild_id> <user_id>",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guildId = args[0];
    const userId = args[1];

    if (!guildId || !userId) return message.reply(`Usage: ${command.usage}`);

    await client.db.dashboardUser.upsert({
      where: { id_guildId: { id: userId, guildId } },
      update: {},
      create: { id: userId, guildId },
    });

    message.reply(
      `User \`${userId}\` has been granted dashboard access for server \`${guildId}\`.`,
    );
  },
};

export default command;
