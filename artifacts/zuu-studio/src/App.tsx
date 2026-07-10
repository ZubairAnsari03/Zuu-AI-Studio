import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
const NotFoundPage = lazy(() => import("@/pages/not-found"));

// Lazy load protected pages
const StudioPage = lazy(() => import("@/pages/StudioPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const CharactersPage = lazy(() => import("@/pages/CharactersPage"));
const PromptsPage = lazy(() => import("@/pages/PromptsPage"));
const CreditsPage = lazy(() => import("@/pages/CreditsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, requireAdmin = false }: { component: any, requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Navigate in an effect — never call setLocation during render
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation("/login");
    } else if (requireAdmin && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [isLoading, user, requireAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050508] text-purple-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && user.role !== "admin") return null;

  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
        </div>
      }>
        <Component />
      </Suspense>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      <Route path="/studio">
        <ProtectedRoute component={StudioPage} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/history">
        <ProtectedRoute component={HistoryPage} />
      </Route>
      <Route path="/characters">
        <ProtectedRoute component={CharactersPage} />
      </Route>
      <Route path="/prompts">
        <ProtectedRoute component={PromptsPage} />
      </Route>
      <Route path="/credits">
        <ProtectedRoute component={CreditsPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminPage} requireAdmin={true} />
      </Route>

      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
