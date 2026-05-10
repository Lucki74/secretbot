export interface GuildConfig {
  prefix?: string;
  muteRoleId?: string;
  levels?: Array<{ id: string; type: "user" | "role"; level: number }>;
  plugins?: {
    logging?: { enabled: boolean; channels?: Record<string, string> };
    starboard?: { enabled: boolean; channelId?: string; threshold?: number };
    automod?: { enabled: boolean };
    welcome?: { enabled: boolean };
    moderation?: { enabled: boolean };
    utility?: { enabled: boolean };
  };
  welcome?: {
    enabled: boolean;
    channelId?: string;
    message?: string;
    dm?: boolean;
  };
  automod?: {
    enabled: boolean;
    spam?: { count: number; interval: number };
    mentionSpam?: { max: number };
    capsFilter?: { percentage: number; action: string };
    antiInvite?: { enabled: boolean; action: string };
    rules?: Array<{
      pattern: string;
      flags?: string;
      action: "delete" | "warn" | "mute" | "kick" | "ban";
      reason?: string;
      enabled?: boolean;
    }>;
  };
  autoReactions?: Array<{ channelId: string; reactions: string[] }>;
  autoDelete?: Array<{ channelId: string; delay: number }>;
  selfGrantableRoles?: Array<{ roleId: string; name: string }>;
  rules?: string[];
  pingableRoles?: Array<{ roleId: string; timeout: number }>;
}
