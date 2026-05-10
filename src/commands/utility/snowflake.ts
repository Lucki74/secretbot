import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "snowflake",
  description: "Converts a Discord snowflake ID to a timestamp.",
  usage: "!snowflake <id>",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const id = args[0];
    if (!id || !/^\d{17,19}$/.test(id)) {
      return message.reply("Please provide a valid snowflake ID.");
    }

    const timestamp = Number((BigInt(id) >> 22n) + 1420070400000n);
    const unixTimestamp = Math.floor(timestamp / 1000);

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("Snowflake Information")
      .addFields(
        { name: "ID", value: id, inline: true },
        { name: "Created At", value: `<t:${unixTimestamp}:F>`, inline: true },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
