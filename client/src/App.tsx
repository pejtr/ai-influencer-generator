import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Gallery from "./pages/Gallery";
import Pricing from "./pages/Pricing";
import Affiliate from "./pages/Affiliate";
import AdminDashboard from "./pages/AdminDashboard";
import Scheduler from "./pages/Scheduler";
import BatchGeneration from "./pages/BatchGeneration";
import FanvueConnect from "./pages/FanvueConnect";
import ThemeSwitcher from "./components/ThemeSwitcher";
import Chat from "./pages/Chat";
import Companions from "./pages/Companions";
import CreatorDashboard from "./pages/CreatorDashboard";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import { AdminChatAnalytics } from "./pages/AdminChatAnalytics";
import MyModels from "./pages/MyModels";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PromptLibrary from "./pages/PromptLibrary";
import CloneWorkflow from "./pages/CloneWorkflow";
import ContentStrategy from "./pages/ContentStrategy";
import PwaAnalytics from "./pages/PwaAnalytics";
import CohortAnalysis from "./pages/CohortAnalysis";
import ConversionFunnel from "./pages/ConversionFunnel";
import MobileBottomNav from "./components/MobileBottomNav";
import { useServiceWorker } from "./hooks/useServiceWorker";
import InstallBanner from "./components/InstallBanner";
import { usePwaTracking } from "./hooks/usePwaTracking";
import { useMobileTracking } from "./hooks/useMobileTracking";
import { useHeatmapTracking } from "./hooks/useHeatmapTracking";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/studio" component={Studio} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/scheduler" component={Scheduler} />
      <Route path="/batch" component={BatchGeneration} />
      <Route path="/fanvue" component={FanvueConnect} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/companions" component={Companions} />
      <Route path="/creator" component={CreatorDashboard} />
      <Route path="/creator/personalities" component={CreatorDashboard} />
      <Route path="/admin/knowledge" component={AdminKnowledgeBase} />
      <Route path="/admin/chat-analytics" component={AdminChatAnalytics} />
      <Route path="/models" component={MyModels} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/prompts" component={PromptLibrary} />
      <Route path="/workflow" component={CloneWorkflow} />
      <Route path="/earn" component={ContentStrategy} />
      <Route path="/content-strategy" component={ContentStrategy} />
      <Route path="/admin/pwa-analytics" component={PwaAnalytics} />
      <Route path="/admin/cohort-analysis" component={CohortAnalysis} />
      <Route path="/admin/funnel" component={ConversionFunnel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OfflineBanner() {
  const { isOffline, hasUpdate, update } = useServiceWorker();

  if (!isOffline && !hasUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] text-center text-sm py-1.5 px-4">
      {isOffline && (
        <div className="bg-amber-600 text-white">
          You are offline. Some features may be limited.
        </div>
      )}
      {hasUpdate && !isOffline && (
        <div className="bg-primary text-white flex items-center justify-center gap-2">
          <span>A new version is available.</span>
          <button onClick={update} className="underline font-medium hover:opacity-80">
            Update now
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  usePwaTracking();
  useMobileTracking();
  useHeatmapTracking(true);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <OfflineBanner />
          <Router />
          <MobileBottomNav />
          <InstallBanner />
          <ThemeSwitcher />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
