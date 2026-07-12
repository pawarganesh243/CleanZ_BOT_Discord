<div align="center">
  <img src="cleanz_discord_avatar.png" width="128" height="128" alt="CleanZ Bot Avatar">
  <h1>CleanZ Discord Bot</h1>
  <p>A powerful, lightweight, and incredibly safe bulk-deletion Discord bot built with Node.js and Discord.js v14.</p>
</div>

<br />

## 🚀 Features
- **Smart Dual-Pool Deletion:** Effortlessly deletes messages under 14 days old instantly via bulk deletion, and intelligently back-tracks to safely delete older messages one-by-one.
- **Strict Rate-Limit Protection:** Implements a strict `1.2s` backoff timer for older messages, ensuring the bot *never* hits a fatal HTTP 429 API rate limit.
- **Slash Commands Native:** Fully integrated into Discord's UI using modern `/clean <amount>` Slash Commands.
- **Safe & Secure:** Natively checks for `Manage Messages` permissions on both the user invoking the command and the bot itself before executing.

## 💻 Installation

### Prerequisites
- [Node.js](https://nodejs.org/en/) installed on your machine.
- A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications).

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/pawarganesh243/CleanZ_BOT_Discord.git
   cd CleanZ_BOT_Discord
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your token:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   ```
4. Start the bot:
   ```bash
   node bot.js
   ```

## 🔐 Permissions Required
When inviting this bot to a server, ensure the following integer is used for OAuth2 Permissions (`2147560448`):
- `View Channels`
- `Send Messages`
- `Manage Messages`
- `Read Message History`
- `Use Slash Commands`

## 📜 Legal
See the included [TOS.md](TOS.md) and [PRIVACY.md](PRIVACY.md) files for Verification compliance details.
