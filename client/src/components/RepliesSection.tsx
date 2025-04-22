import { useState, useEffect } from "react";
import { useDiscord } from "@/context/DiscordContext";
import { Card } from "@/components/ui/card";
import { MessageSquare, RefreshCw, UserCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MessageReply {
  id: number;
  content: string;
  sentAt: string;
  senderInfo: {
    userId: string;
    username: string;
  };
  isReply: boolean;
}

export default function RepliesSection() {
  const { botId, isConnected } = useDiscord();
  const [messages, setMessages] = useState<MessageReply[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // Query to fetch message history
  const { data: messageHistory, isLoading, refetch } = useQuery({
    queryKey: ['/api/discord/message-history', botId],
    queryFn: async ({ queryKey }) => {
      if (!botId) return { success: true, messages: [] };
      try {
        const response = await apiRequest(`/api/discord/message-history/${botId}`);
        if (response && typeof response === 'object') {
          return { success: true, messages: response.messages || [] };
        }
        return { success: true, messages: [] };
      } catch (error) {
        console.error("Error fetching message history:", error);
        return { success: false, messages: [] };
      }
    },
    enabled: !!botId && isConnected,
  });

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!isConnected || !botId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setWsConnected(true);
      
      // Send initial message with botId for filtering
      socket.send(JSON.stringify({
        type: 'init',
        botId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        if (data.type === 'message' && data.data?.botId === botId) {
          // Add new message to the state
          setMessages(prev => [{
            id: Date.now(), // Temporary ID until we refetch
            content: data.data.content,
            sentAt: data.data.timestamp || new Date().toISOString(),
            senderInfo: {
              userId: data.data.userId,
              username: data.data.username
            },
            isReply: true
          }, ...prev]);

          // Notify about new message
          toast({
            title: "New Reply Received",
            description: `${data.data.username}: ${data.data.content.substring(0, 30)}${data.data.content.length > 30 ? '...' : ''}`,
            duration: 5000
          });
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setWsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
    };

    setWebsocket(socket);

    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [botId, isConnected, toast]);

  // Format date and time
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Filter messages by search query
  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.senderInfo?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update local messages when data is fetched
  useEffect(() => {
    if (messageHistory?.messages) {
      setMessages(messageHistory.messages);
    }
  }, [messageHistory]);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="bg-card rounded-xl border border-border/30 w-full h-[calc(100vh-180px)] flex flex-col">
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-medium">Message Replies</h2>
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-muted-foreground">
            {wsConnected ? 'Real-time updates active' : 'Real-time updates inactive'}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search replies..."
              className="py-1.5 px-3 pr-8 bg-background rounded-md text-sm border border-border/30 w-[180px] placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 h-full px-2 text-muted-foreground"
              onClick={() => setSearchQuery("")}
              disabled={!searchQuery}
            >
              {searchQuery ? <Trash2 className="h-4 w-4" /> : null}
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="p-1.5 bg-background rounded-md hover:bg-muted"
            onClick={handleRefresh}
            disabled={isLoading || !isConnected}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </Card>
          ))
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Connect your Discord bot to see message replies</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>{searchQuery ? 'No replies match your search' : 'No message replies yet'}</p>
            <p className="text-sm text-muted-foreground mt-2">When Discord users reply to your bot, they will appear here</p>
          </div>
        ) : (
          // Actual message list
          filteredMessages.map((message) => (
            <Card key={message.id} className="p-4 hover:bg-muted/10 transition-colors">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-5 w-5 text-primary/70" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{message.senderInfo?.username || 'Unknown User'}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(message.sentAt)}
                    </div>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Status Footer */}
      <div className="border-t border-border/30 p-3 flex justify-between items-center text-xs text-muted-foreground">
        <div>
          {filteredMessages.length > 0 
            ? `${filteredMessages.length} ${filteredMessages.length === 1 ? 'reply' : 'replies'}${searchQuery ? ' matching search' : ''}`
            : 'No message replies'
          }
        </div>
        <div className="flex items-center gap-1.5">
          <div>
            <span className="font-medium mr-1">Messages:</span>
            <span className="font-mono">ID-{botId?.substring(0, 8)}</span>
          </div>
          <div className="h-4 w-px bg-border/30"></div>
          <div>
            <span className="font-medium mr-1">Status:</span>
            <span className="text-green-500 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}