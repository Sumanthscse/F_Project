import { 
  LayoutDashboard, 
  Truck, 
  AlertTriangle, 
  Search, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  MoreVertical, 
  ChevronRight
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Vehicle Records", url: "/vehicle-records", icon: Truck },
  { title: "Incident Reports", url: "/incident-reports", icon: AlertTriangle },
  { title: "Search & Filter", url: "/search", icon: Search },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('sidebar_collapsed') === '1');
  const toggle = () => { const next = !collapsed; setCollapsed(next); localStorage.setItem('sidebar_collapsed', next ? '1' : '0'); };
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-secondary";

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-card border-r flex flex-col transition-all duration-200`}>
      {/* Logo Section */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sm">Sand Transport Monitoring</h1>
              <p className="text-xs text-muted-foreground">Mining & Revenue Department</p>
            </div>
          )}
        </div>
        <button className="p-2 rounded hover:bg-secondary" title="Toggle sidebar" onClick={toggle}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          {items.map((item) => (
            <NavLink 
              key={item.title}
              to={item.url} 
              end={item.url === "/"} 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${getNavCls({ isActive })}`
              }
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-3 border-t">
        <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary w-full text-left transition-colors" onClick={() => { localStorage.removeItem('auth_is_logged_in'); navigate('/login'); }}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}