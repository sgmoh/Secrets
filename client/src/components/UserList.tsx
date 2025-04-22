import { useState, useEffect } from "react";
import { useDiscord } from "@/context/DiscordContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, UserPlusIcon } from "lucide-react";
import { DiscordUser } from "@shared/schema";

export default function UserList() {
  const { isConnected, isLoadingUsers, users, fetchUsers, selectedUsers, addSelectedUser, botId } = useDiscord();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = async () => {
    if (!isConnected || !botId) {
      toast({
        title: "Not Connected",
        description: "Please connect your Discord bot first.",
        variant: "destructive",
      });
      return;
    }
    
    await fetchUsers(botId);
  };

  // Initial load of users when bot connects
  useEffect(() => {
    if (isConnected && botId && users.length === 0 && !isLoadingUsers) {
      fetchUsers(botId);
    }
  }, [isConnected, botId]);

  const isUserSelected = (userId: string) => {
    return selectedUsers.some(user => user.id === userId);
  };

  return (
    <div className="bg-card rounded-xl border border-border/30 flex-1 md:max-w-[50%] flex flex-col">
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <h2 className="font-medium">Available Users</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search users..."
              className="py-1.5 px-3 pr-8 bg-background rounded-md text-sm border border-border/30 w-[180px] placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="p-1.5 bg-background rounded-md hover:bg-muted"
            onClick={handleRefresh}
            disabled={isLoadingUsers || !isConnected}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoadingUsers ? (
          // Loading skeletons
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="flex items-center p-2 rounded-md mb-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            </div>
          ))
        ) : !isConnected ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Connect your Discord bot to see users
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {searchQuery ? 'No users match your search' : 'No users found'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center p-2 rounded-md hover:bg-muted/30 cursor-pointer mb-1 group"
            >
              <div className="flex-shrink-0">
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.username} profile`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 ${user.status === 'online' ? 'bg-green-500' : user.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'} rounded-full border-2 border-card`}></span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.displayName || user.username}
                </p>
              </div>
              <div className={`${isUserSelected(user.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="p-1.5 rounded-md bg-background hover:bg-muted text-sm transition-colors"
                  onClick={() => addSelectedUser(user)}
                  disabled={isUserSelected(user.id)}
                >
                  <UserPlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
