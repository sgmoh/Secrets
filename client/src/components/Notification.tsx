import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  title: string;
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  title,
  message,
  type,
  onClose,
  duration = 5000,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    if (duration > 0) {
      const timeout = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
    }
  };

  const getIconContainerClass = () => {
    switch (type) {
      case "success":
        return "p-2 rounded-full bg-green-500/20 text-green-500";
      case "error":
        return "p-2 rounded-full bg-red-500/20 text-red-500";
      case "warning":
        return "p-2 rounded-full bg-yellow-500/20 text-yellow-500";
      case "info":
        return "p-2 rounded-full bg-blue-500/20 text-blue-500";
    }
  };

  return (
    <div
      className={`bg-card border border-border/30 rounded-lg p-3 shadow-lg transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-[200%] opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={getIconContainerClass()}>{getIcon()}</div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground" onClick={handleClose}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
