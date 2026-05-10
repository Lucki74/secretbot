import { MessageReaction, User } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { ReactionRoleManager } from "../utils/ReactionRoleManager.js";

export default async (client: SecretbotClient, reaction: MessageReaction, user: User) => {
  await ReactionRoleManager.handleReactionRemove(client, reaction, user);
};
