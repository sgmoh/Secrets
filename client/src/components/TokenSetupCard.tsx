import { useState } from "react";
import { useDiscord } from "@/context/DiscordContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TokenSetupCardProps {
  onShowError: () => void;
}

export default function TokenSetupCard({ onShowError }: TokenSetupCardProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const { isConnected, isConnecting, connect, botData, connectionStatus } = useDiscord();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!token.trim()) {
      toast({
        title: "Warning",
        description: "Please enter a bot token first.",
        variant: "destructive",
      });
      return;
    }

    const result = await connect(token);
    if (!result.success) {
      onShowError();
    }
  };

  return (
    <div className="bg-card rounded-xl p-5 shadow-lg border border-border/30 w-full flex-shrink-0">
      <h2 className="text-lg font-semibold mb-4">Bot Connection</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="token" className="block text-sm font-medium mb-1">
            Discord Bot Token
          </label>
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              placeholder="Enter your Discord bot token"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your token is securely used for Discord API requests only.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Bot"
          )}
        </Button>

        {/* Bot Status Section */}
        <div className="pt-4 border-t border-border/30">
          <h3 className="text-sm font-medium mb-3">Bot Status</h3>

          <div className="space-y-2.5">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-2 rounded-md bg-background">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                <span className="text-sm">Connection</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Permissions Status */}
            <div className="flex items-center justify-between p-2 rounded-md bg-background">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                <span className="text-sm">Permissions</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Verified' : 'Unknown'}
              </span>
            </div>

            {/* Servers Status */}
            <div className="flex items-center justify-between p-2 rounded-md bg-background">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus.servers > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                <span className="text-sm">Servers</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {connectionStatus.servers || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
