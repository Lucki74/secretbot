# Secretbot

Secretbot is a TypeScript-based Discord moderation bot with a built-in Express dashboard. It features a comprehensive moderation suite, automated filters, server logging, and persistent data management using Prisma and MySQL.

## Setup Instructions

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Configure the .env file with your DATABASE_URL, DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, SESSION_SECRET, and STAFF_IDS.
4. Run npx prisma db push to synchronize the database schema.
5. Build the project using `npm run build`.
6. Start the bot and dashboard using `npm start`.

## Command List

### General
- about
- help
- ping
- reload_guild
- source

### Moderation
- addcase
- ban
- case
- casenote
- cases
- deletecase
- deletenote
- forceban
- kick
- massban
- mute
- mutestatus
- reason
- softban
- tempban
- unban
- unmute
- warn
- warnlist

### Owner
- add_dashboard_user
- allow_server
- channel_to_server
- disallow_server
- leave_server
- remove_dashboard_user
- servers

### Utility
- archive
- automod
- avatar
- bansearch
- channel
- clean
- context
- counter
- emoji
- invite
- jumbo
- level
- locateuser
- namehistory
- nick
- pingable
- post
- reactrole
- remind
- role
- roleinfo
- rolepersist
- roles
- rules
- search
- selfgrant
- selfmute
- server
- slowmode
- snowflake
- tag
- user
- vcdisconnect
- vcmove
- vcmoveall
