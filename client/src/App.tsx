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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ThemeSwitcher />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
