import { Client, GatewayIntentBits, ApplicationCommandOptionType, PermissionsBitField, REST, Routes, EmbedBuilder, ActivityType } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';

// Dummy Web Server for Render
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('CleanZ Bot is alive!'));
app.listen(port, () => console.log(`Dummy web server listening on port ${port}`));


dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Sleep helper function for rate limit backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function cleanupMessages(channel, amount) {
  try {
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);

    let messagesFetched = 0;
    let lastMessageId = null;
    let keepFetching = true;
    let deletedCount = 0;

    while (keepFetching && messagesFetched < amount) {
      const fetchLimit = Math.min(100, amount - messagesFetched);
      const options = { limit: fetchLimit };
      if (lastMessageId) {
        options.before = lastMessageId;
      }

      // Fetch historical messages using pagination cursor
      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) {
        keepFetching = false;
        break;
      }

      lastMessageId = messages.last().id;
      messagesFetched += messages.size;

      // Split into two pools based on the 14-day rule
      const under14Days = messages.filter(msg => msg.createdTimestamp > fourteenDaysAgo);
      const over14Days = messages.filter(msg => msg.createdTimestamp <= fourteenDaysAgo);

      // Pool 1: Messages UNDER 14 days old (bulk delete)
      if (under14Days.size > 0) {
        try {
          await channel.bulkDelete(under14Days, true);
          deletedCount += under14Days.size;
        } catch (error) {
          if (error.code !== 10008) { // Ignore Unknown Message error (already deleted)
            console.error('Error during bulk delete:', error);
          }
        }
      }

      // Pool 2: Messages OVER 14 days old (individual delete with backoff)
      for (const [id, msg] of over14Days) {
        try {
          await msg.delete();
          deletedCount++;
          await sleep(1200); // 1.2 seconds backoff to prevent HTTP 429 rate-limit blocks
        } catch (error) {
          if (error.code !== 10008) { // Ignore Unknown Message error
            console.error(`Error deleting message ${id}:`, error);
          }
        }
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error(`Failed to clean up messages in channel ${channel.name}. Check permissions.`, error);
    throw error;
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('/clean', { type: ActivityType.Listening });

  // Register Slash Commands globally
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    console.log('Started refreshing application (/) commands.');
    
    const commands = [
      {
        name: 'clean',
        description: 'Deletes a specified number of messages in the channel.',
        options: [
          {
            name: 'amount',
            description: 'The number of messages to delete',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
            max_value: 1000
          }
        ],
        // Only allow members with Manage Messages permission to use this
        default_member_permissions: PermissionsBitField.Flags.ManageMessages.toString()
      }
    ];

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'clean') {
    const amount = interaction.options.getInteger('amount');

    // Acknowledge the interaction immediately to prevent timeout
    await interaction.deferReply({ ephemeral: true });

    // Ensure bot has Manage Messages permission safely using appPermissions
    if (!interaction.appPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.editReply({ content: 'I do not have the **Manage Messages** permission in this channel!' });
    }

    try {
      const deletedCount = await cleanupMessages(interaction.channel, amount);
      
      const successEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setDescription(`✅ Successfully deleted **${deletedCount}** messages. 😊`);

      await interaction.editReply({ content: '', embeds: [successEmbed] });

      // Delete the reply after 1.5 seconds
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (err) {
          // Ignore if it was already deleted
        }
      }, 1500);
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ An error occurred while cleaning up messages. Ensure I have the right permissions.' });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
