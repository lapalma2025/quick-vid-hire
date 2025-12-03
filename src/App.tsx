import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import NewJob from "./pages/NewJob";
import EditJob from "./pages/EditJob";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import WorkerProfile from "./pages/WorkerProfile";
import Workers from "./pages/Workers";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import ClientTips from "./pages/ClientTips";
import Safety from "./pages/Safety";
import WorkerGuide from "./pages/WorkerGuide";
import Reviews from "./pages/Reviews";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/new" element={<NewJob />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/jobs/:id/edit" element={<EditJob />} />
          <Route path="/jobs/:id/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/worker/:id" element={<WorkerProfile />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/client-tips" element={<ClientTips />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/worker-guide" element={<WorkerGuide />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/help" element={<Help />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
