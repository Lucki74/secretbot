import express from "express";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as yaml from "yaml";
import { fileURLToPath } from "url";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import http from "http";
import { Server } from "socket.io";
import { SecretbotClient } from "../SecretbotClient.js";
import { EmbedBuilder, TextChannel } from "discord.js";
import { ConfigManager } from "../utils/ConfigManager.js";
import { LogManager } from "../utils/LogManager.js";
import { Colors } from "../utils/Colors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startDashboard(client: SecretbotClient) {
  dotenv.config({ override: true });
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const db = client.db;
  const port = process.env.PORT || 3000;

  function deepMerge(target: any, source: any): any {
    const out = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === "object"
      ) {
        out[key] = deepMerge(target[key], source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required for the dashboard!");
  }

  const memoryStore = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new memoryStore({ checkPeriod: 86400000 }),
    }),
  );

  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(
      new DiscordStrategy(
        {
          clientID: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
          callbackURL:
            process.env.DISCORD_REDIRECT_URI ||
            `http://localhost:${port}/auth/discord/callback`,
          scope: ["identify", "guilds"],
        },
        (accessToken, refreshToken, profile, done) => {
          return done(null, profile);
        },
      ),
    );
  } else {
    console.warn(
      "OAuth2 Credentials missing! Bypassing authentication for development.",
    );
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../public")));

  app.get("/secretbot.png", (req, res) =>
    res.sendFile(path.resolve("./secretbot.png")),
  );

  const checkAuth = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ error: "Unauthorized" });
    next();
  };

  const checkGuildAuth = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ error: "Unauthorized" });

    const staffIds = process.env.STAFF_IDS?.split(",") || [];
    if (staffIds.includes(req.user.id)) return next();

    const guildId = req.params.guildId || req.params.id;
    if (!guildId) return res.status(400).json({ error: "Missing guild ID" });

    // Check if user has MANAGE_GUILD (0x20) permission via OAuth2 guilds
    const userGuild = req.user.guilds?.find((g: any) => g.id === guildId);
    if (userGuild && (BigInt(userGuild.permissions) & 0x20n) === 0x20n) {
      return next();
    }

    const allowed = await db.dashboardUser.findUnique({
      where: { id_guildId: { id: req.user.id, guildId } },
    });

    if (!allowed)
      return res.status(403).json({
        error: "Forbidden: You do not have dashboard access to this guild.",
      });

    next();
  };

  app.get("/auth/discord", passport.authenticate("discord"));
  app.get(
    "/auth/discord/callback",
    passport.authenticate("discord", {
      failureRedirect: "/",
    }),
    (req, res) => res.redirect("/"),
  );
  app.get("/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  });
  app.get("/auth/status", (req: any, res) => {
    res.json({ authenticated: req.isAuthenticated(), user: req.user });
  });

  io.on("connection", (socket) => {});
  client.dashboardIo = io;

  app.get("/api/guilds", checkAuth, async (req: any, res) => {
    try {
      let userGuilds: string[] = [];
      const guilds = req.user.guilds || [];
      userGuilds = guilds
        .filter((g: any) => (BigInt(g.permissions) & 0x20n) === 0x20n)
        .map((g: any) => g.id);

      const dbGuilds = await db.guild.findMany();
      const dashboardAccess = await db.dashboardUser.findMany({
        where: { id: req.user.id },
      });
      const dashGuilds = dashboardAccess.map((d) => d.guildId);
      const filteredGuilds = dbGuilds.filter(
        (g) => userGuilds.includes(g.id) || dashGuilds.includes(g.id),
      );

      res.json(
        filteredGuilds.map((g) => {
          const botGuild = client.guilds.cache.get(g.id);
          return {
            id: g.id,
            name: botGuild?.name || g.id,
            icon: botGuild?.iconURL() || null,
          };
        }),
      );
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch guilds" });
    }
  });

  app.get("/api/guilds/:guildId", checkGuildAuth, async (req: any, res) => {
    try {
      const guildId = req.params.guildId;
      const guild = await db.guild.findUnique({
        where: { id: guildId },
      });
      if (!guild) return res.status(404).json({ error: "Guild not found" });

      const botGuild = client.guilds.cache.get(guildId);

      const casesCount = await db.case.count({
        where: { guildId, deletedAt: null },
      });
      const tagsCount = await db.tag.count({ where: { guildId } });
      const activeMutes = await db.mute.count({
        where: { guildId, active: true },
      });
      const activeBans = await db.tempBan.count({
        where: { guildId, active: true },
      });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const casesLast7Days = await db.case.findMany({
        where: { guildId, createdAt: { gte: sevenDaysAgo }, deletedAt: null },
        select: { createdAt: true },
      });

      const caseCountsByDay: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        caseCountsByDay[d.toISOString().split("T")[0]!] = 0;
      }
      casesLast7Days.forEach((c) => {
        const day = c.createdAt.toISOString().split("T")[0]!;
        if (caseCountsByDay[day] !== undefined) caseCountsByDay[day]++;
      });

      const modActivity = await db.case.groupBy({
        by: ["modId"],
        where: { guildId, deletedAt: null },
        _count: { modId: true },
        orderBy: { _count: { modId: "desc" } },
        take: 5,
      });

      const modActivityData = await Promise.all(
        modActivity.map(async (m) => {
          const user = await client.users
            .fetch(m.modId)
            .catch(() => ({ username: "Unknown" }));
          return { name: (user as any).username, count: m._count.modId };
        }),
      );

      let parsedConfig = {};
      try {
        parsedConfig = yaml.parse(guild.config) || {};
      } catch (e) {}

      const channels =
        botGuild?.channels.cache.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        })) || [];
      const roles =
        botGuild?.roles.cache.map((r) => ({ id: r.id, name: r.name })) || [];

      res.json({
        id: guild.id,
        rawConfig: guild.config,
        config: parsedConfig,
        stats: {
          cases: casesCount,
          tags: tagsCount,
          activeMutes,
          activeBans,
          memberCount: botGuild?.memberCount || 0,
          onlineCount: botGuild?.members
            ? botGuild.members.cache.filter(
                (m) =>
                  m.presence?.status === "online" ||
                  m.presence?.status === "dnd" ||
                  m.presence?.status === "idle",
              ).size
            : 0,
        },
        charts: {
          cases: caseCountsByDay,
          mods: modActivityData,
        },
        channels,
        roles,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch guild data" });
    }
  });

  app.get(
    "/api/guilds/:guildId/config",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const guild = await db.guild.findUnique({
          where: { id: req.params.guildId },
        });
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        let parsedConfig = {};
        try {
          parsedConfig = yaml.parse(guild.config) || {};
        } catch (e) {}
        res.json(parsedConfig);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch config" });
      }
    },
  );

  app.post(
    "/api/guilds/:guildId/config",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const jsonConfig = req.body;
        const guild = await db.guild.findUnique({
          where: { id: req.params.guildId },
        });
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        let parsedConfig: any = {};
        try {
          parsedConfig = yaml.parse(guild.config) || {};
        } catch {}

        const merged = deepMerge(parsedConfig, jsonConfig);
        const yamlString = yaml.stringify(merged);

        await db.guild.update({
          where: { id: req.params.guildId },
          data: { config: yamlString },
        });

        ConfigManager.invalidate(req.params.guildId);

        const logEmbed = new EmbedBuilder()
          .setTitle("Config Updated")
          .setDescription(
            `Guild config updated via dashboard by \`${req.user.id}\``,
          )
          .setColor(Colors.INFO)
          .setTimestamp();
        await LogManager.log(
          client,
          req.params.guildId,
          "config_update",
          logEmbed,
        );

        res.json({ success: true, config: merged, rawConfig: yamlString });
      } catch (error) {
        res.status(500).json({ error: "Failed to save config" });
      }
    },
  );

  app.post(
    "/api/guilds/:guildId/config/raw",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const { yaml: rawYaml } = req.body;
        if (!rawYaml) return res.status(400).json({ error: "Missing YAML" });

        try {
          yaml.parse(rawYaml);
        } catch (e) {
          return res
            .status(400)
            .json({ error: `Invalid YAML: ${(e as Error).message}` });
        }

        await db.guild.update({
          where: { id: req.params.guildId },
          data: { config: rawYaml },
        });

        ConfigManager.invalidate(req.params.guildId);

        const logEmbed = new EmbedBuilder()
          .setTitle("Config Updated (Raw)")
          .setDescription(
            `Guild config updated via YAML editor by \`${req.user.id}\``,
          )
          .setColor(Colors.INFO)
          .setTimestamp();
        await LogManager.log(
          client,
          req.params.guildId,
          "config_update",
          logEmbed,
        );

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to save config" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/cases",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const { userId, modId, type, page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where: any = { guildId: req.params.guildId, deletedAt: null };
        if (userId) where.userId = userId;
        if (modId) where.modId = modId;
        if (type) where.type = type;
        const cases = await db.case.findMany({
          where,
          orderBy: { caseNumber: "desc" },
          skip,
          take: Number(limit),
        });
        const total = await db.case.count({ where });
        res.json({
          cases,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch cases" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/cases/:caseId",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const caseData = await db.case.findFirst({
          where: {
            id: Number(req.params.caseId),
            guildId: req.params.guildId,
            deletedAt: null,
          },
          include: { notes: true },
        });
        if (!caseData) return res.status(404).json({ error: "Case not found" });
        const user = await client.users
          .fetch(caseData.userId)
          .catch(() => ({ username: "Unknown User" }));
        const mod = await client.users
          .fetch(caseData.modId)
          .catch(() => ({ username: "Unknown Mod" }));
        res.json({
          ...caseData,
          userTag: (user as any).username,
          modTag: (mod as any).username,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch case" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/tags",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const tags = await db.tag.findMany({
          where: { guildId: req.params.guildId },
          orderBy: { name: "asc" },
        });
        res.json(tags);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch tags" });
      }
    },
  );

  app.post(
    "/api/guilds/:guildId/tags",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const { name, content } = req.body;
        if (!name || !content)
          return res
            .status(400)
            .json({ error: "Name and content are required." });
        const newTag = await db.tag.create({
          data: {
            guildId: req.params.guildId,
            userId: req.user.id,
            name,
            content,
          },
        });
        res.json({ success: true, tag: newTag });
      } catch (error) {
        res.status(500).json({ error: "Failed to create tag" });
      }
    },
  );

  app.delete(
    "/api/guilds/:guildId/tags/:tagId",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        await db.tag.delete({
          where: { id: Number(req.params.tagId), guildId: req.params.guildId },
        });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete tag" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/namehistory",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        const history = await db.nameHistory.findMany({
          where: { userId: String(userId) },
          orderBy: { recordedAt: "desc" },
          take: 50,
        });
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch name history" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/reactionroles",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const rrs = await db.reactionRole.findMany({
          where: { guildId: req.params.guildId },
        });
        res.json(rrs);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch reaction roles" });
      }
    },
  );

  app.post(
    "/api/guilds/:guildId/reactionroles",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const { messageId, emoji, roleId } = req.body;
        const rr = await db.reactionRole.create({
          data: { guildId: req.params.guildId, messageId, emoji, roleId },
        });
        res.json(rr);
      } catch (error) {
        res.status(500).json({ error: "Failed to create reaction role" });
      }
    },
  );

  app.delete(
    "/api/guilds/:guildId/reactionroles/:id",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        await db.reactionRole.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete reaction role" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/persistroles",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const roles = await db.persistRole.findMany({
          where: { guildId: req.params.guildId },
        });
        res.json(roles);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch persist roles" });
      }
    },
  );

  app.delete(
    "/api/guilds/:guildId/persistroles/:id",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        await db.persistRole.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete persist role" });
      }
    },
  );

  app.post(
    "/api/guilds/:guildId/send-embed",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const botGuild = client.guilds.cache.get(req.params.guildId);
        if (!botGuild)
          return res.status(404).json({ error: "Guild not found" });
        const { channelId, title, description, color } = req.body;
        const channel = botGuild.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased())
          return res.status(400).json({ error: "Invalid channel" });
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color);
        await (channel as TextChannel).send({ embeds: [embed] });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to send embed" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/members",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const botGuild = client.guilds.cache.get(req.params.guildId);
        if (!botGuild)
          return res.status(404).json({ error: "Guild not found" });
        const query = ((req.query.q as string) || "").toLowerCase();
        const members = await botGuild.members.fetch({ query, limit: 20 });
        const result = members.map((m) => ({
          id: m.id,
          username: m.user.username,
          displayName: m.displayName,
          avatar: m.user.displayAvatarURL(),
          joinedAt: m.joinedAt,
          roles: m.roles.cache
            .filter((r) => r.name !== "@everyone")
            .map((r) => ({ id: r.id, name: r.name, color: r.hexColor })),
        }));
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Search failed" });
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/automod",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const guild = await db.guild.findUnique({
          where: { id: req.params.guildId },
        });
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        let parsedConfig: any = {};
        try {
          parsedConfig = yaml.parse(guild.config) || {};
        } catch (e) {}
        const automodRules = parsedConfig.automod?.rules || [];
        res.json(automodRules);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch automod rules" });
      }
    },
  );

  app.post(
    "/api/guilds/:guildId/automod",
    checkGuildAuth,
    async (req: any, res) => {
      try {
        const newRules = req.body;
        const guild = await db.guild.findUnique({
          where: { id: req.params.guildId },
        });
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        let parsedConfig: any = {};
        try {
          parsedConfig = yaml.parse(guild.config) || {};
        } catch (e) {}
        if (!parsedConfig.automod) parsedConfig.automod = {};
        parsedConfig.automod.rules = newRules;
        const yamlString = yaml.stringify(parsedConfig);
        await db.guild.update({
          where: { id: req.params.guildId },
          data: { config: yamlString },
        });

        ConfigManager.invalidate(req.params.guildId);

        const logEmbed = new EmbedBuilder()
          .setTitle("Config Updated (Automod)")
          .setDescription(
            `Automod rules updated via dashboard by \`${req.user.id}\``,
          )
          .setColor(Colors.INFO)
          .setTimestamp();
        await LogManager.log(
          client,
          req.params.guildId,
          "config_update",
          logEmbed,
        );

        res.json({ success: true, rules: newRules });
      } catch (error) {
        res.status(500).json({ error: "Failed to update automod rules" });
      }
    },
  );

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
  });

  app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "dashboard.html"));
  });

  app.use((req, res) => {
    res.redirect("/");
  });

  server.listen(port, () => {
    console.log(`Dashboard listening at http://localhost:${port}`);
  });
}
