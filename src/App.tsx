import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import PrayerHistory from "./pages/PrayerHistory";
import Leaderboard from "./pages/Leaderboard";
import Campaign from "./pages/Campaign";
import Settings from "./pages/Settings";
import AboutDeveloper from "./pages/AboutDeveloper";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/prayer-history" element={<PrayerHistory />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/campaign" element={<Campaign />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about-developer" element={<AboutDeveloper />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
