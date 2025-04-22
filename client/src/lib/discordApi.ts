import { apiRequest } from "./queryClient";
import type { DiscordBot, DiscordUser } from "@shared/schema";

interface ValidateTokenResponse {
  success: boolean;
  message?: string;
  bot?: DiscordBot;
  details?: any;
}

interface FetchUsersResponse {
  success: boolean;
  message?: string;
  users?: DiscordUser[];
  details?: any;
}

interface SendMessagesResponse {
  success: boolean;
  message?: string;
  results?: Array<{
    userId: string;
    success: boolean;
    details?: any;
  }>;
}

export async function validateToken(token: string): Promise<ValidateTokenResponse> {
  try {
    const response = await apiRequest("POST", "/api/discord/validate-token", { token });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to validate token",
    };
  }
}

export async function fetchUsers(botId: string): Promise<FetchUsersResponse> {
  try {
    const response = await apiRequest("GET", `/api/discord/users?botId=${botId}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

export async function getUsersByBotId(botId: string): Promise<FetchUsersResponse> {
  try {
    const response = await apiRequest("GET", `/api/discord/users/${botId}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get users",
    };
  }
}

export async function sendMessages(
  botId: string,
  userIds: string[],
  content: string
): Promise<SendMessagesResponse> {
  try {
    const response = await apiRequest("POST", "/api/discord/send-messages", {
      botId,
      userIds,
      content,
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send messages",
    };
  }
}
