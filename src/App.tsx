import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Generate from "./pages/Generate";
import Video from "./pages/Video";
import Chat from "./pages/Chat";
import Changelog from "./pages/Changelog";
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";
import { WhatsNewModal } from "./components/WhatsNewModal";
import { ProtectedRoute } from "./components/ProtectedRoute";
import WhatsAppButton from "./components/WhatsAppButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WhatsNewModal />
        <WhatsAppButton />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/generate" element={<ProtectedRoute><Generate /></ProtectedRoute>} />
          <Route path="/video" element={<ProtectedRoute><Video /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/changelog" element={<ProtectedRoute><Changelog /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
