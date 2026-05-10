import { VoiceState, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";
import { Colors } from "../utils/Colors.js";

export default async function (
  client: SecretbotClient,
  oldState: VoiceState,
  newState: VoiceState,
) {
  const guildId = newState.guild.id;
  const member = newState.member;
  if (!member) return;

  const embed = new EmbedBuilder()
    .setTimestamp()
    .setColor(Colors.VOICE)
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL(),
    });

  if (!oldState.channelId && newState.channelId) {
    embed
      .setTitle("Voice Channel Joined")
      .setDescription(
        `${member} joined voice channel <#${newState.channelId}>`,
      );
    await LogManager.log(client, guildId, "voice_join", embed);
  } else if (oldState.channelId && !newState.channelId) {
    embed
      .setTitle("Voice Channel Left")
      .setDescription(`${member} left voice channel <#${oldState.channelId}>`);
    await LogManager.log(client, guildId, "voice_leave", embed);
  } else if (
    oldState.channelId &&
    newState.channelId &&
    oldState.channelId !== newState.channelId
  ) {
    embed
      .setTitle("Voice Channel Moved")
      .setDescription(
        `${member} moved from <#${oldState.channelId}> to <#${newState.channelId}>`,
      );
    await LogManager.log(client, guildId, "voice_move", embed);
  } else if (!oldState.serverMute && newState.serverMute) {
    embed
      .setTitle("Server Muted in Voice")
      .setDescription(`${member} was server muted in <#${newState.channelId}>`);
    await LogManager.log(client, guildId, "voice_mute", embed);
  } else if (oldState.serverMute && !newState.serverMute) {
    embed
      .setTitle("Server Unmuted in Voice")
      .setDescription(
        `${member} was server unmuted in <#${newState.channelId}>`,
      );
    await LogManager.log(client, guildId, "voice_unmute", embed);
  } else if (!oldState.serverDeaf && newState.serverDeaf) {
    embed
      .setTitle("Server Deafened in Voice")
      .setDescription(
        `${member} was server deafened in <#${newState.channelId}>`,
      );
    await LogManager.log(client, guildId, "voice_deafen", embed);
  } else if (oldState.serverDeaf && !newState.serverDeaf) {
    embed
      .setTitle("Server Undeafened in Voice")
      .setDescription(
        `${member} was server undeafened in <#${newState.channelId}>`,
      );
    await LogManager.log(client, guildId, "voice_undeafen", embed);
  }
}
