import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Discord user schema
export const discordUsers = pgTable("discord_users", {
  id: text("id").primaryKey(), // Discord user ID
  username: text("username").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  status: text("status"),
  botId: text("bot_id").notNull(), // Which bot fetched this user
});

// Discord bot schema
export const discordBots = pgTable("discord_bots", {
  id: text("id").primaryKey(), // Discord bot ID
  username: text("username").notNull(),
  token: text("token").notNull(),
  avatarUrl: text("avatar_url"),
});

// Message history schema
export const messageHistory = pgTable("message_history", {
  id: serial("id").primaryKey(),
  botId: text("bot_id").notNull(),
  content: text("content").notNull(),
  sentAt: text("sent_at").notNull(),
  recipientCount: integer("recipient_count").notNull(),
});

// Insert schemas
export const insertDiscordUserSchema = createInsertSchema(discordUsers);
export const insertDiscordBotSchema = createInsertSchema(discordBots);
export const insertMessageHistorySchema = createInsertSchema(messageHistory);

// Types
export type DiscordUser = typeof discordUsers.$inferSelect;
export type InsertDiscordUser = z.infer<typeof insertDiscordUserSchema>;

export type DiscordBot = typeof discordBots.$inferSelect;
export type InsertDiscordBot = z.infer<typeof insertDiscordBotSchema>;

export type MessageHistory = typeof messageHistory.$inferSelect;
export type InsertMessageHistory = z.infer<typeof insertMessageHistorySchema>;

// Discord API types
export type ApiDiscordUser = {
  id: string;
  username: string;
  display_name?: string;
  avatar?: string;
  global_name?: string;
  discriminator?: string;
};

export type ApiDiscordBot = {
  id: string;
  username: string;
  avatar?: string;
  discriminator?: string;
};

export type ApiDiscordGuild = {
  id: string;
  name: string;
  icon?: string;
};

export type ApiDiscordGuildMember = {
  user: ApiDiscordUser;
  nick?: string;
  avatar?: string;
  status?: string;
};
