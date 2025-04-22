import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface TokenErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails?: {
    status?: number;
    statusText?: string;
    message?: string;
  };
}

export default function TokenErrorModal({
  isOpen,
  onClose,
  errorDetails,
}: TokenErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-500/20 p-2 rounded-full text-primary">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">Connection Error</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-foreground">
            We couldn't connect to Discord with the provided token. This could be due to:
          </p>

          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Invalid bot token format</li>
            <li>Bot token has expired or been revoked</li>
            <li>Discord API rate limiting</li>
            <li>Network connectivity issues</li>
          </ul>

          {errorDetails && (
            <div className="bg-background p-3 rounded-md text-sm text-foreground font-mono overflow-x-auto">
              <code>
                {errorDetails.status ? `Error ${errorDetails.status}: ` : ""}
                {errorDetails.message || errorDetails.statusText || "Invalid authentication token provided."}
              </code>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="flex items-center gap-1">
            <span className="i-ri-question-line"></span>
            <span>Get Help</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
