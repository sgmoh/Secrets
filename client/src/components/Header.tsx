import { useDiscord } from "@/context/DiscordContext";
import { Button } from "@/components/ui/button";
import { GhostIcon, HelpCircleIcon, SettingsIcon } from "lucide-react";

export default function Header() {
  const { isConnected, botData } = useDiscord();

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="bg-primary w-8 h-8 rounded-md flex items-center justify-center">
          <GhostIcon className="text-white text-lg" />
        </div>
        <h1 className="text-2xl font-bold text-white">OurSecrets</h1>
      </div>
      
      <div className="hidden md:flex items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-muted text-sm flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
          <HelpCircleIcon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
