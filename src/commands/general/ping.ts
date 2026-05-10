import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "ping",
  description: "Checks the bot's latency.",
  usage: "!ping",
  category: "general",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const sent = await message.reply("Pinging...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    sent.edit(
      `Pong! Latency: ${latency}ms. API Latency: ${Math.round(client.ws.ping)}ms.`,
    );
  },
};

export default command;
