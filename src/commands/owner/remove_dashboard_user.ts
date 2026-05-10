import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "remove_dashboard_user",
  description: "Removes dashboard access for a user in a specific guild.",
  usage: "!remove_dashboard_user <guild_id> <user_id>",
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

    await client.db.dashboardUser.deleteMany({
      where: { id: userId, guildId },
    });

    message.reply(
      `User \`${userId}\` dashboard access removed for server \`${guildId}\`.`,
    );
  },
};

export default command;
