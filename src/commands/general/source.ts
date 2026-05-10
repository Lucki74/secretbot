import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "source",
  description: "Displays the link to the bot's source code.",
  usage: "!source",
  category: "general",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    message.reply(
      "Secretbot is open-source! You can find the source code here: <https://github.com/Lucki74/secretbot>",
    );
  },
};

export default command;
