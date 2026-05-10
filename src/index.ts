import { GatewayIntentBits, Partials } from "discord.js";
import { SecretbotClient } from "./SecretbotClient.js";
import * as dotenv from "dotenv";
import { startDashboard } from "./dashboard/server.js";

dotenv.config({ override: true });

const client = new SecretbotClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});

client
  .start(process.env.DISCORD_TOKEN!)
  .then(async () => {
    startDashboard(client);
  })
  .catch(console.error);
