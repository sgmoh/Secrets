import { useState } from "react";
import { useDiscord } from "@/context/DiscordContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Clock,
  Save,
  FileText,
  UserCheck,
  SmilePlus,
  Paperclip,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function MessageComposer() {
  const [message, setMessage] = useState("");
  const { isConnected, selectedUsers, removeSelectedUser, botId } = useDiscord();
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!botId || selectedUsers.length === 0 || !message.trim()) {
        throw new Error("Missing required data");
      }
      
      const userIds = selectedUsers.map(user => user.id);
      return await apiRequest("POST", "/api/discord/send-messages", {
        botId,
        userIds,
        content: message,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Messages Sent",
        description: data.message,
      });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Messages",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your Discord bot first.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one user to send a message to.",
        variant: "destructive",
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate();
  };

  const handleAddTemplate = (template: string) => {
    setMessage(prev => prev + template);
  };

  const handleAddUsername = () => {
    setMessage(prev => prev + "{username}");
  };

  return (
    <div className="bg-card rounded-xl border border-border/30 flex-1 flex flex-col">
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <h2 className="font-medium">Message Compose</h2>
        <div className="flex items-center gap-1 text-sm px-3 py-1 bg-background rounded-full">
          <span className="text-primary">{selectedUsers.length}</span>
          <span className="text-muted-foreground">recipients selected</span>
        </div>
      </div>

      {/* Selected Users List */}
      <div className="p-4 border-b border-border/30 overflow-x-auto flex gap-2 min-h-16 items-center">
        {selectedUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
            No users selected. Add users from the list to send a message.
          </div>
        ) : (
          selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm">{user.username}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 rounded-full hover:bg-muted"
                onClick={() => removeSelectedUser(user.id)}
              >
                <span className="sr-only">Remove</span>
                ×
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Message Input Box */}
      <div className="flex-1 flex flex-col p-4">
        <Textarea
          placeholder="Type your message here... The message will be sent to all selected users."
          className="w-full h-32 p-3 bg-background border border-border/30 rounded-md resize-none text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none mb-4 custom-scrollbar"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Template & Personalization Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="px-3 py-1.5 rounded-md bg-background text-sm hover:bg-muted transition-colors flex items-center gap-1"
            onClick={() => handleAddTemplate("Hello, I wanted to reach out about...")}
          >
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3 py-1.5 rounded-md bg-background text-sm hover:bg-muted transition-colors flex items-center gap-1"
            onClick={handleAddUsername}
          >
            <UserCheck className="h-4 w-4" />
            <span>Add Username</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3 py-1.5 rounded-md bg-background text-sm hover:bg-muted transition-colors flex items-center gap-1"
          >
            <SmilePlus className="h-4 w-4" />
            <span>Emoji</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3 py-1.5 rounded-md bg-background text-sm hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Paperclip className="h-4 w-4" />
            <span>Attachment</span>
          </Button>
        </div>

        {/* Send Controls */}
        <div className="flex justify-between items-center mt-auto">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Schedule message"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Save as draft"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="px-4 py-2 rounded-md bg-background hover:bg-muted transition-colors text-sm font-medium"
            >
              Preview
            </Button>
            <Button
              className="px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
              onClick={handleSendMessage}
              disabled={
                sendMessageMutation.isPending || 
                !isConnected || 
                selectedUsers.length === 0 || 
                !message.trim()
              }
            >
              {sendMessageMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
