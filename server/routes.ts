import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import { z } from "zod";
import { 
  insertDiscordBotSchema, 
  insertDiscordUserSchema, 
  insertMessageHistorySchema 
} from "@shared/schema";

// Discord API constants
const DISCORD_API_URL = "https://discord.com/api/v10";

// Helper function to validate Discord token and get bot information
async function validateDiscordToken(token: string) {
  try {
    const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.ok) {
      return { valid: false, status: response.status, statusText: response.statusText };
    }

    const data = await response.json();
    return { valid: true, bot: data };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

// Helper function to fetch guild members from Discord API
async function fetchGuildMembers(token: string, guildId: string) {
  try {
    const response = await fetch(`${DISCORD_API_URL}/guilds/${guildId}/members?limit=1000`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, status: response.status, statusText: response.statusText };
    }

    const data = await response.json();
    return { success: true, members: data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to fetch guilds from Discord API
async function fetchGuilds(token: string) {
  try {
    const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, status: response.status, statusText: response.statusText };
    }

    const data = await response.json();
    return { success: true, guilds: data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to send a DM to a user
async function sendDirectMessage(token: string, userId: string, content: string) {
  try {
    // Create a DM channel first
    const createChannelResponse = await fetch(`${DISCORD_API_URL}/users/@me/channels`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: userId,
      }),
    });

    if (!createChannelResponse.ok) {
      return { 
        success: false, 
        status: createChannelResponse.status, 
        statusText: createChannelResponse.statusText 
      };
    }

    const channelData = await createChannelResponse.json();
    const channelId = channelData.id;

    // Send message to the channel
    const sendMessageResponse = await fetch(`${DISCORD_API_URL}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      }),
    });

    if (!sendMessageResponse.ok) {
      return { 
        success: false, 
        status: sendMessageResponse.status, 
        statusText: sendMessageResponse.statusText 
      };
    }

    const messageData = await sendMessageResponse.json();
    return { success: true, message: messageData };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // 1. Validate Discord bot token
  app.post('/api/discord/validate-token', async (req: Request, res: Response) => {
    const tokenSchema = z.object({
      token: z.string().min(1),
    });

    try {
      const { token } = tokenSchema.parse(req.body);
      const validationResult = await validateDiscordToken(token);

      if (!validationResult.valid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid Discord token', 
          details: validationResult 
        });
      }

      const bot = validationResult.bot;

      // Save bot to storage
      const savedBot = await storage.saveBot({
        id: bot.id,
        username: bot.username,
        token: token,
        avatarUrl: bot.avatar ? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png` : null,
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Token validated successfully', 
        bot: savedBot 
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error instanceof z.ZodError 
          ? 'Invalid input data'
          : 'Failed to validate token',
        details: error instanceof z.ZodError
          ? error.errors
          : (error as Error).message
      });
    }
  });

  // 2. Fetch users from Discord servers
  app.get('/api/discord/users', async (req: Request, res: Response) => {
    const botIdSchema = z.object({
      botId: z.string().min(1),
    });

    try {
      const { botId } = botIdSchema.parse(req.query);
      
      // Get bot from storage
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ 
          success: false, 
          message: 'Bot not found' 
        });
      }

      // Fetch guilds (servers) the bot is in
      const guildsResult = await fetchGuilds(bot.token);
      
      if (!guildsResult.success) {
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to fetch guilds', 
          details: guildsResult 
        });
      }

      // Fetch members from all guilds
      const allMembers = [];
      for (const guild of guildsResult.guilds) {
        const membersResult = await fetchGuildMembers(bot.token, guild.id);
        if (membersResult.success) {
          allMembers.push(...membersResult.members);
        }
      }

      // Process and save unique users
      const uniqueUsers = new Map();
      for (const member of allMembers) {
        if (member.user && !member.user.bot) { // Skip bots
          const user = member.user;
          if (!uniqueUsers.has(user.id)) {
            uniqueUsers.set(user.id, {
              id: user.id,
              username: user.username,
              displayName: user.global_name || member.nick || user.username,
              avatarUrl: user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` 
                : null,
              status: 'online', // Default status
              botId: botId,
            });
          }
        }
      }

      // Save users to storage
      const users = Array.from(uniqueUsers.values());
      await storage.saveUsers(users as any);

      return res.status(200).json({ 
        success: true, 
        message: 'Users fetched successfully', 
        users 
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error instanceof z.ZodError 
          ? 'Invalid input data'
          : 'Failed to fetch users',
        details: error instanceof z.ZodError
          ? error.errors
          : (error as Error).message
      });
    }
  });

  // 3. Get users by bot ID
  app.get('/api/discord/users/:botId', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      
      // Get users from storage
      const users = await storage.getUsersByBotId(botId);
      
      return res.status(200).json({ 
        success: true, 
        users 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get users',
        details: (error as Error).message
      });
    }
  });

  // 4. Send bulk direct messages
  app.post('/api/discord/send-messages', async (req: Request, res: Response) => {
    const sendMessageSchema = z.object({
      botId: z.string().min(1),
      userIds: z.array(z.string()).min(1),
      content: z.string().min(1),
    });

    try {
      const { botId, userIds, content } = sendMessageSchema.parse(req.body);
      
      // Get bot from storage
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ 
          success: false, 
          message: 'Bot not found' 
        });
      }

      // Send messages to all users
      const results = [];
      let successCount = 0;
      
      for (const userId of userIds) {
        const result = await sendDirectMessage(bot.token, userId, content);
        results.push({
          userId,
          success: result.success,
          details: result.success ? undefined : result,
        });
        
        if (result.success) {
          successCount++;
        }
      }

      // Save message history
      await storage.saveMessageHistory({
        botId,
        content,
        sentAt: new Date().toISOString(),
        recipientCount: successCount,
      });

      return res.status(200).json({ 
        success: true, 
        message: `Sent messages to ${successCount} out of ${userIds.length} users`, 
        results 
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error instanceof z.ZodError 
          ? 'Invalid input data'
          : 'Failed to send messages',
        details: error instanceof z.ZodError
          ? error.errors
          : (error as Error).message
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
