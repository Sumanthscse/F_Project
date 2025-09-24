import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VehicleRecords from "./pages/VehicleRecords";
import IncidentReports from "./pages/IncidentReports";
import Search from "./pages/Search";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const isAuthenticated = () => localStorage.getItem("auth_is_logged_in") === "true";

function Protected({ children }: { children: JSX.Element }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Protected><Dashboard /></Protected>} />
                  <Route path="/vehicle-records" element={<Protected><VehicleRecords /></Protected>} />
                  <Route path="/incident-reports" element={<Protected><IncidentReports /></Protected>} />
                  <Route path="/search" element={<Protected><Search /></Protected>} />
                  <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
                  <Route path="/reports" element={<Protected><Reports /></Protected>} />
                  <Route path="/settings" element={<Protected><Settings /></Protected>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
