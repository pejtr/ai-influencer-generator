import { usePushNotifications } from "@/hooks/usePushNotifications";
import { haptic } from "@/lib/haptics";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationSettingsProps {
  compact?: boolean;
}

export default function NotificationSettings({ compact = false }: NotificationSettingsProps) {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    if (compact) return null;
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <BellOff className="w-4 h-4" />
        <span>Notifications not supported in this browser</span>
      </div>
    );
  }

  const handleToggle = async () => {
    haptic("selection");
    if (isSubscribed) {
      await unsubscribe();
      toast.info("Notifications disabled");
    } else {
      const success = await subscribe();
      if (success) {
        haptic("success");
        toast.success("Notifications enabled! You'll be notified when your content is ready.");
      } else if (permission === "denied") {
        toast.error("Notifications blocked. Please enable them in your browser settings.");
      }
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className={`p-2 rounded-lg transition-colors ${
          isSubscribed
            ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        title={isSubscribed ? "Disable notifications" : "Enable notifications"}
      >
        {isSubscribed ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isSubscribed ? "bg-blue-500/20 text-blue-500" : "bg-muted text-muted-foreground"
        }`}>
          {isSubscribed ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-medium text-sm">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            {isSubscribed
              ? "You'll be notified when generation completes"
              : "Get notified when your images & videos are ready"}
          </p>
        </div>
      </div>
      <Button
        onClick={handleToggle}
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        className="rounded-full"
      >
        {isSubscribed ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}
