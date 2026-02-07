import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  showLocalNotification: (title: string, options?: NotificationOptions) => void;
}

const VAPID_PUBLIC_KEY_STORAGE = "push-vapid-key";

export function usePushNotifications(): PushNotificationState {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const isSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator;

  useEffect(() => {
    if (!isSupported) return;

    // Check current subscription status
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return false;

      // For now we use local notifications (no VAPID server needed)
      setIsSubscribed(true);
      localStorage.setItem("push-notifications-enabled", "true");
      return true;
    } catch {
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      localStorage.removeItem("push-notifications-enabled");
    } catch {
      // Silently fail
    }
  }, []);

  const showLocalNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return;

      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: "ai-influencer",
          ...options,
        } as NotificationOptions);
      });
    },
    [isSupported, permission]
  );

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}

/**
 * Helper to notify user when generation is complete.
 * Call this from generation mutation onSuccess callbacks.
 */
export function notifyGenerationComplete(
  type: "image" | "video" | "audio",
  showNotification: (title: string, options?: NotificationOptions) => void
) {
  const titles: Record<string, string> = {
    image: "Image Generated!",
    video: "Video Ready!",
    audio: "Audio Generated!",
  };

  const bodies: Record<string, string> = {
    image: "Your AI influencer image is ready to view.",
    video: "Your video has been generated and is ready to download.",
    audio: "Your audio clip has been generated successfully.",
  };

  showNotification(titles[type] || "Generation Complete!", {
    body: bodies[type] || "Your content is ready.",
    data: { type, url: "/gallery" },
  });
}
