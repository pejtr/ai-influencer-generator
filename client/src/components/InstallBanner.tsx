import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { haptic } from "@/lib/haptics";
import { X, Download, Smartphone, Zap, Wifi } from "lucide-react";
import { useState } from "react";

export default function InstallBanner() {
  const { showBanner, install, dismiss } = useInstallPrompt();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  if (!showBanner) return null;

  const handleInstall = async () => {
    haptic("medium");
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      haptic("success");
    }
  };

  const handleDismiss = () => {
    haptic("light");
    setIsExiting(true);
    setTimeout(() => {
      dismiss();
    }, 300);
  };

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[90] transition-all duration-300 ${
        isExiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 animate-in slide-in-from-bottom-4"
      }`}
    >
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/20 p-4 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Install AI Influencer</h3>
              <p className="text-[11px] text-white/70">Add to your home screen</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="flex gap-4 mb-4 text-[11px] text-white/80">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Faster</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-green-300" />
              <span>Offline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-200" />
              <span>No app store</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-white text-blue-600 font-bold text-sm py-2.5 px-4 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Install App
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
