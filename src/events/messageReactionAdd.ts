import { MessageReaction, User } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { StarboardManager } from "../utils/StarboardManager.js";
import { ReactionRoleManager } from "../utils/ReactionRoleManager.js";

export default async (
  client: SecretbotClient,
  reaction: MessageReaction,
  user: User,
) => {
  await StarboardManager.handleReaction(client, reaction, user);
  await ReactionRoleManager.handleReactionAdd(client, reaction, user);
};
