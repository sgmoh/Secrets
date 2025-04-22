import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  Globe,
  HeartPulse,
  RefreshCw,
  Server,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useDiscord } from "@/context/DiscordContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SettingsSection() {
  const { isConnected, botId } = useDiscord();
  const { toast } = useToast();
  const [uptimeRobotKey, setUptimeRobotKey] = useState("");
  const [renderServiceId, setRenderServiceId] = useState("");
  const [isAutoRestartEnabled, setIsAutoRestartEnabled] = useState(true);
  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(true);
  const [isDeploymentConfigured, setIsDeploymentConfigured] = useState(false);

  // Generate webhook URLs
  const baseUrl = window.location.origin;
  const webhookUrl = `${baseUrl}/api/discord/message-received`;
  
  // Handle copying webhook URL
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Webhook URL copied!",
      description: "The webhook URL has been copied to your clipboard.",
      duration: 3000
    });
  };

  // Handle saving Render settings
  const handleSaveRender = () => {
    if (!renderServiceId) {
      toast({
        title: "Error",
        description: "Please enter a valid Render service ID.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    // Save to local storage or your backend
    localStorage.setItem("renderServiceId", renderServiceId);
    setIsDeploymentConfigured(true);
    
    toast({
      title: "Render settings saved!",
      description: "Your Render deployment settings have been saved.",
      duration: 3000
    });
  };

  // Handle saving Uptime Robot settings
  const handleSaveUptimeRobot = () => {
    if (!uptimeRobotKey) {
      toast({
        title: "Error",
        description: "Please enter a valid Uptime Robot API key.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    // Save to local storage or your backend
    localStorage.setItem("uptimeRobotKey", uptimeRobotKey);
    
    toast({
      title: "Uptime Robot settings saved!",
      description: "Your Uptime Robot settings have been saved.",
      duration: 3000
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border/30 w-full h-[calc(100vh-180px)] flex flex-col">
      <div className="p-4 border-b border-border/30">
        <h2 className="font-medium">Application Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure deployment, monitoring, and webhook integrations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <Tabs defaultValue="deployment" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="deployment" className="text-xs">
              <Server className="h-4 w-4 mr-1.5" />
              Deployment
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="text-xs">
              <HeartPulse className="h-4 w-4 mr-1.5" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="text-xs">
              <Globe className="h-4 w-4 mr-1.5" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* Deployment Settings */}
          <TabsContent value="deployment" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Render Deployment</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure your Render deployment settings for easy scaling and management.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Render Service ID</label>
                      <div className="flex gap-2">
                        <Input
                          value={renderServiceId}
                          onChange={(e) => setRenderServiceId(e.target.value)}
                          placeholder="srv-xxxxxxxxxxxx"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Found in your Render dashboard under service settings
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Auto Restart</span>
                        <span className="text-xs text-muted-foreground">
                          Automatically restart the service when it crashes
                        </span>
                      </div>
                      <Switch
                        checked={isAutoRestartEnabled}
                        onCheckedChange={setIsAutoRestartEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Auto Deploy</span>
                        <span className="text-xs text-muted-foreground">
                          Deploy automatically when new updates are available
                        </span>
                      </div>
                      <Switch
                        checked={isAutoUpdateEnabled}
                        onCheckedChange={setIsAutoUpdateEnabled}
                      />
                    </div>

                    <Button onClick={handleSaveRender} className="w-full">
                      Save Render Settings
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Deployment Status</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">
                      {isDeploymentConfigured ? "Configured" : "Not Configured"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isDeploymentConfigured
                      ? "Your deployment settings are configured and ready to use."
                      : "Configure your deployment settings to enable easy scaling and management."}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Monitoring Settings */}
          <TabsContent value="monitoring" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <HeartPulse className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Uptime Robot Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Monitor your application's uptime and receive alerts when it goes down.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Uptime Robot API Key</label>
                      <div className="flex gap-2">
                        <Input
                          value={uptimeRobotKey}
                          onChange={(e) => setUptimeRobotKey(e.target.value)}
                          placeholder="u1234567-0123456789abcdefghijklmn"
                          className="flex-1"
                          type="password"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your Uptime Robot API key from your account dashboard
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Application URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={window.location.origin}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            toast({
                              title: "Copied!",
                              description: "URL copied to clipboard",
                              duration: 2000
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use this URL in your Uptime Robot monitor configuration
                      </p>
                    </div>

                    <Button onClick={handleSaveUptimeRobot} className="w-full">
                      Save Uptime Robot Settings
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Monitor Status</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Operational</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Uptime</span>
                      <span className="font-medium">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Time</span>
                      <span className="font-medium">143ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Checked</span>
                      <span className="font-medium">Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Webhooks Settings */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Discord Webhook</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure webhook endpoints for listening to replies and events.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Reply Webhook URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={webhookUrl}
                          readOnly
                          className="flex-1 font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyWebhook}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use this webhook URL in your Discord bot to forward replies to this application
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Webhook Documentation</span>
                        <span className="text-xs text-muted-foreground">
                          View the full webhook integration documentation
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <span>View Docs</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="rounded-md bg-orange-50 p-3 text-orange-800 text-sm flex gap-2">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Important Note</p>
                        <p className="text-xs mt-1">
                          Your Discord bot must be configured to forward message replies to this webhook for the Reply section to work. See the documentation for details on how to set this up.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gray-50 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-3 w-full">
                  <h3 className="font-medium">Webhook Test</h3>
                  <p className="text-sm text-muted-foreground">
                    Test your webhook integration by sending a sample message
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={!isConnected}
                      onClick={() => {
                        fetch(webhookUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            userId: '123456789',
                            username: 'TestUser',
                            content: 'This is a test message from the webhook integration.',
                            botId: botId || '123456789',
                            timestamp: new Date().toISOString()
                          }),
                        })
                        .then(response => {
                          if (response.ok) {
                            toast({
                              title: "Test Successful",
                              description: "Test message sent successfully. Check the Replies tab to see it.",
                              duration: 5000
                            });
                          } else {
                            throw new Error('Network response was not ok');
                          }
                        })
                        .catch(error => {
                          toast({
                            title: "Test Failed",
                            description: `Failed to send test message: ${error.message}`,
                            variant: "destructive",
                            duration: 5000
                          });
                        });
                      }}
                    >
                      <span>Send Test Message</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isConnected}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span>Verify Connection</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-border/30 p-3 flex justify-between items-center text-xs text-muted-foreground">
        <div>
          Status: <span className="text-green-500 font-medium">Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div>
            <span className="font-medium mr-1">Uptime:</span>
            <span className="font-mono">99.9%</span>
          </div>
          <div className="h-4 w-px bg-border/30"></div>
          <div>
            <span className="font-medium mr-1">Last Updated:</span>
            <span className="font-mono">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}