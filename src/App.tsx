import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TabBar } from "@/components/TabBar";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import NewPost from "./pages/NewPost";
import Goals from "./pages/Goals";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <div className="relative">
                      <Feed />
                      <TabBar />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={<Navigate to="/feed" replace />}
              />
              <Route
                path="/explorar"
                element={
                  <ProtectedRoute>
                    <div className="relative">
                      <Explore />
                      <TabBar />
                    </div>
                  </ProtectedRoute>
                }
              />
              {/* Redirect old explore route to new one */}
              <Route path="/explore" element={<Navigate to="/explorar" replace />} />
              <Route
                path="/nova"
                element={
                  <ProtectedRoute>
                    <div className="relative">
                      <NewPost />
                      <TabBar />
                    </div>
                  </ProtectedRoute>
                }
              />
              {/* Redirect old post/new route to new one */}
              <Route path="/post/new" element={<Navigate to="/nova" replace />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <div className="relative">
                      <Messages />
                      <TabBar />
                    </div>
                  </ProtectedRoute>
                }
              />
              {/* Redirect old messages route to new one */}
              <Route path="/messages" element={<Navigate to="/chat" replace />} />
              <Route
                path="/metas"
                element={
                  <ProtectedRoute>
                    <div className="relative">
                      <Goals />
                      <TabBar />
                    </div>
                  </ProtectedRoute>
                }
              />
              {/* Redirect old goals route to new one */}
              <Route path="/goals" element={<Navigate to="/metas" replace />} />
              <Route
                path="/perfil-@:username"
                element={
                  <ProtectedRoute>
                    <div className="relative">
                      <Profile />
                      <TabBar />
                    </div>
                  </ProtectedRoute>
                }
              />
              {/* Redirect old profile route - Note: this won't work perfectly as ID != username */}
              <Route path="/profile/:id" element={<Navigate to="/feed" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
