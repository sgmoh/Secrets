import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
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

// Helper function to fetch guild members from Discord API with pagination
async function fetchGuildMembers(token: string, guildId: string, limit = 1000) {
  try {
    let allMembers: any[] = [];
    let after = null;
    let hasMore = true;
    
    // Use pagination to get all members efficiently
    while (hasMore && allMembers.length < limit) {
      const url = new URL(`${DISCORD_API_URL}/guilds/${guildId}/members`);
      url.searchParams.append('limit', '100'); // API allows max 100 per request
      if (after) url.searchParams.append('after', after);
      
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bot ${token}`,
        },
      });

      if (!response.ok) {
        return { 
          success: false, 
          status: response.status, 
          statusText: response.statusText 
        };
      }

      const data = await response.json();
      if (data.length === 0) {
        hasMore = false;
      } else {
        allMembers = [...allMembers, ...data];
        // Get last member ID for pagination
        after = data[data.length - 1].user.id;
      }
      
      // If we've hit our limit, stop paginating
      if (allMembers.length >= limit) {
        hasMore = false;
      }
    }

    return { success: true, members: allMembers };
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

  // 2. Fetch users from Discord servers with improved performance
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

      // First return any cached users we already have
      // This makes the UI responsive immediately
      const cachedUsers = await storage.getUsersByBotId(botId);
      
      // Start fetching fresh data in the background
      (async () => {
        try {
          // Fetch guilds (servers) the bot is in
          const guildsResult = await fetchGuilds(bot.token);
          
          if (!guildsResult.success) {
            console.error('Failed to fetch guilds:', guildsResult);
            return;
          }

          // Fetch members from all guilds in parallel for speed
          const memberPromises = guildsResult.guilds.map(guild => 
            fetchGuildMembers(bot.token, guild.id)
          );
          
          // Wait for all member requests to complete
          const membersResults = await Promise.all(memberPromises);
          
          // Collect all successful results
          const allMembers = [];
          for (const result of membersResults) {
            if (result.success) {
              allMembers.push(...result.members);
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
          
          console.log(`Background fetch completed: ${users.length} users found`);
        } catch (error) {
          console.error('Error in background fetch:', error);
        }
      })();

      // Return immediately with cached users for responsiveness
      return res.status(200).json({ 
        success: true, 
        message: 'Users retrieved (fresh data is being fetched in background)', 
        users: cachedUsers
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
      messageDelay: z.number().int().min(0).max(10000).optional().default(0), // Delay in ms between messages
    });

    try {
      const { botId, userIds, content, messageDelay } = sendMessageSchema.parse(req.body);
      
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
        // Add delay between messages if specified
        if (messageDelay > 0 && results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, messageDelay));
        }
        
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
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    clients.add(ws);
    
    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Discord message relay',
      timestamp: new Date().toISOString()
    }));
    
    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different types of messages
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Remove client on disconnect
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });
  });
  
  // Helper function to broadcast to all connected clients
  const broadcastMessage = (message: any) => {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  };
  
  // Add a middleware to broadcast DM responses
  app.post('/api/discord/message-received', async (req: Request, res: Response) => {
    const messageSchema = z.object({
      userId: z.string(),
      content: z.string(),
      username: z.string(),
      timestamp: z.string().optional(),
      botId: z.string()
    });
    
    try {
      const messageData = messageSchema.parse(req.body);
      
      // Broadcast the received message to all connected clients
      broadcastMessage({
        type: 'message',
        data: messageData,
        timestamp: messageData.timestamp || new Date().toISOString()
      });
      
      // Store the message in history
      await storage.saveMessageHistory({
        botId: messageData.botId,
        content: messageData.content,
        sentAt: messageData.timestamp || new Date().toISOString(),
        recipientCount: 1,
        isReply: true,
        senderInfo: {
          userId: messageData.userId,
          username: messageData.username
        }
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof z.ZodError 
          ? 'Invalid input data'
          : 'Failed to process message',
        details: error instanceof z.ZodError
          ? error.errors
          : (error as Error).message
      });
    }
  });
  
  return httpServer;
}
