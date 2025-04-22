import { useState } from "react";
import Header from "@/components/Header";
import TokenSetupCard from "@/components/TokenSetupCard";
import UserList from "@/components/UserList";
import MessageComposer from "@/components/MessageComposer";
import Footer from "@/components/Footer";
import TokenErrorModal from "@/components/TokenErrorModal";
import { useDiscord } from "@/context/DiscordContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Home() {
  const { isConnected, errorDetails } = useDiscord();
  const [activeTab, setActiveTab] = useState("user-selection");
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  return (
    <>
      {/* Grid Background Effect */}
      <div className="grid-background fixed inset-0 -z-10"></div>
      
      {/* Red Gradient Elements */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] bg-primary opacity-10 blur-[120px] rounded-full -z-10"></div>
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-primary opacity-10 blur-[100px] rounded-full -z-10"></div>
      
      {/* App Container */}
      <div className="flex flex-col min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
        <Header />
        
        {/* Main Content */}
        <main className="flex flex-col md:flex-row gap-6 flex-grow overflow-hidden">
          <TokenSetupCard onShowError={() => setShowErrorModal(true)} />
          
          {/* Main Workspace */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="user-selection" className="flex-1 flex flex-col">
              <TabsList className="border-b border-border mb-4 justify-start">
                <TabsTrigger value="user-selection">User Selection</TabsTrigger>
                <TabsTrigger value="message-history">Message History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="user-selection" className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                <UserList />
                <MessageComposer />
              </TabsContent>
              
              <TabsContent value="message-history" className="h-full">
                <div className="flex items-center justify-center h-full bg-card/50 rounded-xl border border-border">
                  <p className="text-muted-foreground">Message history will be shown here</p>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="h-full">
                <div className="flex items-center justify-center h-full bg-card/50 rounded-xl border border-border">
                  <p className="text-muted-foreground">Settings will be shown here</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
      
      {/* Error Modal */}
      {showErrorModal && (
        <TokenErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          errorDetails={errorDetails}
        />
      )}
    </>
  );
}
