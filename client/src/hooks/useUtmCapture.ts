import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Captures UTM parameters from URL on first visit and sends them to the server
 * to set the user's acquisition channel. Only fires once per session.
 */
export function useUtmCapture() {
  const { user } = useAuth();
  const hasSent = useRef(false);
  const updateChannel = trpc.revenue.updateChannel.useMutation();

  useEffect(() => {
    if (!user || hasSent.current) return;

    // Check if we have UTM params in URL or stored in sessionStorage
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") || sessionStorage.getItem("utm_source") || undefined;
    const utmMedium = params.get("utm_medium") || sessionStorage.getItem("utm_medium") || undefined;
    const utmCampaign = params.get("utm_campaign") || sessionStorage.getItem("utm_campaign") || undefined;

    // Store UTM params in sessionStorage for persistence across page loads
    if (params.get("utm_source")) sessionStorage.setItem("utm_source", params.get("utm_source")!);
    if (params.get("utm_medium")) sessionStorage.setItem("utm_medium", params.get("utm_medium")!);
    if (params.get("utm_campaign")) sessionStorage.setItem("utm_campaign", params.get("utm_campaign")!);

    // Only send if we have any UTM data
    if (utmSource || utmMedium || utmCampaign) {
      hasSent.current = true;
      updateChannel.mutate({ utmSource, utmMedium, utmCampaign });
    }
  }, [user]);
}
