import { createContext, useContext, useState, ReactNode } from "react";
import { validateToken, fetchUsers as apiFetchUsers, getUsersByBotId } from "@/lib/discordApi";
import { useToast } from "@/hooks/use-toast";
import { DiscordBot, DiscordUser } from "@shared/schema";

interface ConnectionStatus {
  servers: number;
}

interface DiscordContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isLoadingUsers: boolean;
  botId: string | null;
  botData: DiscordBot | null;
  users: DiscordUser[];
  selectedUsers: DiscordUser[];
  connectionStatus: ConnectionStatus;
  errorDetails: {
    status?: number;
    statusText?: string;
    message?: string;
  } | null;
  connect: (token: string) => Promise<{ success: boolean }>;
  disconnect: () => void;
  fetchUsers: (botId: string) => Promise<void>;
  addSelectedUser: (user: DiscordUser) => void;
  removeSelectedUser: (userId: string) => void;
  clearSelectedUsers: () => void;
}

const DiscordContext = createContext<DiscordContextType>({
  isConnected: false,
  isConnecting: false,
  isLoadingUsers: false,
  botId: null,
  botData: null,
  users: [],
  selectedUsers: [],
  connectionStatus: { servers: 0 },
  errorDetails: null,
  connect: async () => ({ success: false }),
  disconnect: () => {},
  fetchUsers: async () => {},
  addSelectedUser: () => {},
  removeSelectedUser: () => {},
  clearSelectedUsers: () => {},
});

export function DiscordProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);
  const [botData, setBotData] = useState<DiscordBot | null>(null);
  const [users, setUsers] = useState<DiscordUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<DiscordUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ servers: 0 });
  const [errorDetails, setErrorDetails] = useState<{
    status?: number;
    statusText?: string;
    message?: string;
  } | null>(null);

  const { toast } = useToast();

  const connect = async (token: string): Promise<{ success: boolean }> => {
    setIsConnecting(true);
    setErrorDetails(null);

    try {
      const result = await validateToken(token);

      if (result.success && result.bot) {
        setIsConnected(true);
        setBotId(result.bot.id);
        setBotData(result.bot);
        toast({
          title: "Connection Successful",
          description: `Connected as ${result.bot.username}`,
        });
        return { success: true };
      } else {
        setIsConnected(false);
        setBotId(null);
        setBotData(null);
        setErrorDetails({
          status: result.details?.status,
          statusText: result.details?.statusText,
          message: result.message || "Failed to connect",
        });
        return { success: false };
      }
    } catch (error) {
      setIsConnected(false);
      setBotId(null);
      setBotData(null);
      setErrorDetails({
        message: error instanceof Error ? error.message : "Unknown error occurred",
      });
      return { success: false };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setBotId(null);
    setBotData(null);
    setUsers([]);
    setSelectedUsers([]);
    setConnectionStatus({ servers: 0 });
  };

  const fetchUsers = async (botId: string) => {
    if (!isConnected) return;
    
    setIsLoadingUsers(true);
    
    try {
      // First, check if we have users in storage
      const storedUsersResult = await getUsersByBotId(botId);
      
      if (storedUsersResult.success && storedUsersResult.users && storedUsersResult.users.length > 0) {
        setUsers(storedUsersResult.users);
      }
      
      // Then fetch fresh data
      const fetchResult = await apiFetchUsers(botId);
      
      if (fetchResult.success && fetchResult.users) {
        setUsers(fetchResult.users);
        if (fetchResult.users.length > 0) {
          const uniqueServers = new Set(fetchResult.users.map(user => user.botId));
          setConnectionStatus({ servers: uniqueServers.size });
        }
        toast({
          title: "Users Fetched",
          description: `Found ${fetchResult.users.length} users`,
        });
      } else {
        toast({
          title: "Error",
          description: fetchResult.message || "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const addSelectedUser = (user: DiscordUser) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const clearSelectedUsers = () => {
    setSelectedUsers([]);
  };

  return (
    <DiscordContext.Provider
      value={{
        isConnected,
        isConnecting,
        isLoadingUsers,
        botId,
        botData,
        users,
        selectedUsers,
        connectionStatus,
        errorDetails,
        connect,
        disconnect,
        fetchUsers,
        addSelectedUser,
        removeSelectedUser,
        clearSelectedUsers,
      }}
    >
      {children}
    </DiscordContext.Provider>
  );
}

export const useDiscord = () => useContext(DiscordContext);
