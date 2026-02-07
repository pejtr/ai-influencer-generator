import { useEffect, useState } from "react";

interface ServiceWorkerState {
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isOffline: !navigator.onLine,
    hasUpdate: false,
    registration: null,
  });

  useEffect(() => {
    // Track online/offline status
    const handleOnline = () => setState((s) => ({ ...s, isOffline: false }));
    const handleOffline = () => setState((s) => ({ ...s, isOffline: true }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          setState((s) => ({
            ...s,
            isInstalled: true,
            registration,
          }));

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setState((s) => ({ ...s, hasUpdate: true }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn("SW registration failed:", error);
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const update = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  const clearImageCache = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_IMAGE_CACHE",
      });
    }
  };

  return {
    ...state,
    update,
    clearImageCache,
  };
}
