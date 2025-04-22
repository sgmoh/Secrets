import { 
  discordUsers,
  discordBots,
  messageHistory,
  type DiscordUser,
  type InsertDiscordUser,
  type DiscordBot,
  type InsertDiscordBot,
  type MessageHistory,
  type InsertMessageHistory
} from "@shared/schema";

export interface IStorage {
  // Discord Bot operations
  getBot(id: string): Promise<DiscordBot | undefined>;
  getBotByToken(token: string): Promise<DiscordBot | undefined>;
  saveBot(bot: InsertDiscordBot): Promise<DiscordBot>;
  
  // Discord User operations
  getUser(id: string): Promise<DiscordUser | undefined>;
  getUsersByBotId(botId: string): Promise<DiscordUser[]>;
  saveUser(user: InsertDiscordUser): Promise<DiscordUser>;
  saveUsers(users: InsertDiscordUser[]): Promise<DiscordUser[]>;
  
  // Message History operations
  saveMessageHistory(message: InsertMessageHistory): Promise<MessageHistory>;
  getMessageHistoryByBotId(botId: string): Promise<MessageHistory[]>;
}

export class MemStorage implements IStorage {
  private bots: Map<string, DiscordBot>;
  private users: Map<string, DiscordUser>;
  private messages: MessageHistory[];
  private currentMessageId: number;

  constructor() {
    this.bots = new Map();
    this.users = new Map();
    this.messages = [];
    this.currentMessageId = 1;
  }

  // Bot operations
  async getBot(id: string): Promise<DiscordBot | undefined> {
    return this.bots.get(id);
  }

  async getBotByToken(token: string): Promise<DiscordBot | undefined> {
    return Array.from(this.bots.values()).find(bot => bot.token === token);
  }

  async saveBot(bot: InsertDiscordBot): Promise<DiscordBot> {
    this.bots.set(bot.id, bot as DiscordBot);
    return bot as DiscordBot;
  }

  // User operations
  async getUser(id: string): Promise<DiscordUser | undefined> {
    return this.users.get(id);
  }

  async getUsersByBotId(botId: string): Promise<DiscordUser[]> {
    return Array.from(this.users.values()).filter(user => user.botId === botId);
  }

  async saveUser(user: InsertDiscordUser): Promise<DiscordUser> {
    this.users.set(user.id, user as DiscordUser);
    return user as DiscordUser;
  }

  async saveUsers(users: InsertDiscordUser[]): Promise<DiscordUser[]> {
    const savedUsers: DiscordUser[] = [];
    for (const user of users) {
      const savedUser = await this.saveUser(user);
      savedUsers.push(savedUser);
    }
    return savedUsers;
  }

  // Message History operations
  async saveMessageHistory(message: InsertMessageHistory): Promise<MessageHistory> {
    // Process senderInfo to convert object to string if needed
    let processedMessage = { ...message };
    
    if (message.senderInfo && typeof message.senderInfo === 'object') {
      processedMessage.senderInfo = JSON.stringify(message.senderInfo);
    }
    
    const newMessage: MessageHistory = {
      ...processedMessage,
      id: this.currentMessageId++
    };
    
    this.messages.push(newMessage);
    return newMessage;
  }

  async getMessageHistoryByBotId(botId: string): Promise<MessageHistory[]> {
    return this.messages.filter(message => message.botId === botId);
  }
}

export const storage = new MemStorage();
