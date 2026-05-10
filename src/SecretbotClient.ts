import { Client, type ClientOptions, Collection } from "discord.js";
import { PrismaClient } from "@prisma/client";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { ReminderScheduler } from "./utils/ReminderScheduler.js";
import { MuteManager } from "./utils/MuteManager.js";
import { TempBanManager } from "./utils/TempBanManager.js";
import { Server as SocketIOServer } from "socket.io";
import type { BotCommand } from "./types/BotCommand.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SecretbotClient extends Client {
  public db: PrismaClient;
  public commands: Collection<string, BotCommand> = new Collection();
  public plugins: Collection<string, any> = new Collection();
  public startupAt: number;
  public reminderScheduler: ReminderScheduler;
  public muteManager: MuteManager;
  public tempBanManager: TempBanManager;
  public dashboardIo?: SocketIOServer;

  constructor(options: ClientOptions) {
    super(options);
    this.db = new PrismaClient();
    this.startupAt = Date.now();
    this.reminderScheduler = new ReminderScheduler(this);
    this.muteManager = new MuteManager(this);
    this.tempBanManager = new TempBanManager(this);
  }

  async start(token: string) {
    await this.loadEvents();
    await this.loadCommands();
    await this.login(token);
  }

  private async loadEvents() {
    const eventsPath = path.join(__dirname, "events");
    if (!fs.existsSync(eventsPath)) return;

    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter(
        (file) =>
          (file.endsWith(".ts") || file.endsWith(".js")) &&
          !file.endsWith(".d.ts"),
      );

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = await import(pathToFileURL(filePath).href);
      const eventName = file.split(".")[0];
      if (eventName) {
        this.on(eventName, (...args) => event.default(this, ...args));
      }
    }
  }

  private async loadCommands(dir = "commands") {
    const commandsPath = path.join(__dirname, dir);
    if (!fs.existsSync(commandsPath)) return;

    const files = fs.readdirSync(commandsPath);

    for (const file of files) {
      const filePath = path.join(commandsPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        await this.loadCommands(path.join(dir, file));
      } else if (
        (file.endsWith(".ts") || file.endsWith(".js")) &&
        !file.endsWith(".d.ts")
      ) {
        const commandModule = await import(pathToFileURL(filePath).href);
        const command: BotCommand = commandModule.default;
        if (command && command.name) {
          command.category = path.basename(dir);
          this.commands.set(command.name, command);
          if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              this.commands.set(alias, command);
            }
          }
        }
      }
    }
  }
}
