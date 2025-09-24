import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { vehicleApi, Incident, Vehicle } from "@/services/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name: string; department: string; email?: string } | null>(null);
  const [casesOpen, setCasesOpen] = useState(false);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description: string; createdAt: string }>>([]);
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem("app_profile");
    if (stored) {
      const p = JSON.parse(stored);
      setProfile({ name: p.name || "User", department: p.department || "Department", email: p.email });
    } else {
      setProfile({ name: "Vaibhavi Malemath", department: "Revenue Department" });
    }
  }, []);

  useEffect(() => {
    (async () => {
      const inc = await vehicleApi.getIncidents();
      const name = profile?.name || "";
      setMyIncidents(inc.filter(i => (i.reportedBy || "").toLowerCase().includes(name.toLowerCase())));
      const vehicles = (await vehicleApi.getVehicles()).vehicles;
      const items: Array<{ id: string; title: string; description: string; createdAt: string }> = [];
      // Build incident notifications
      inc.forEach(i => {
        items.push({
          id: `incident-${i.id}`,
          title: `Incident: ${i.type.replaceAll('_',' ')}`,
          description: `${i.location} • ${i.status.toUpperCase()}`,
          createdAt: i.createdAt,
        });
      });
      // Build vehicle notifications from recent registrations
      vehicles.forEach((v: Vehicle) => {
        items.push({
          id: `vehicle-${v.id}`,
          title: `Vehicle Registered: ${v.vehicleNumber}`,
          description: `${v.ownerName} • ${v.vehicleType}`,
          createdAt: v.createdAt,
        });
      });
      items.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = items.slice(0, 8);
      setNotifications(latest);
      const lastSeen = localStorage.getItem('notif_last_seen');
      const unseen = lastSeen ? latest.filter(n => new Date(n.createdAt).getTime() > new Date(lastSeen).getTime()).length : latest.length;
      setUnread(unseen);
    })();
  }, [profile]);

  const initials = useMemo(() => {
    const n = profile?.name || "User";
    return n.split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase();
  }, [profile]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu onOpenChange={(open)=>{ if (open) { localStorage.setItem('notif_last_seen', new Date().toISOString()); setUnread(0); }}}>
              <DropdownMenuTrigger asChild>
                <div className="relative cursor-pointer">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unread > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-4 h-3 px-1 bg-destructive rounded-full flex items-center justify-center">
                      <span className="text-[10px] leading-none text-destructive-foreground font-bold">{unread}</span>
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2">
                      <span className="text-sm font-medium truncate w-full">{n.title}</span>
                      <span className="text-xs text-muted-foreground truncate w-full">{n.description}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-success text-success-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-left">
                    <p className="font-medium">{profile?.name || "User"}</p>
                    <p className="text-muted-foreground text-xs">{profile?.department || "Department"}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCasesOpen(true)}>My Cases</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>Profile & Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { localStorage.removeItem('auth_is_logged_in'); navigate('/login'); }}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <Dialog open={casesOpen} onOpenChange={setCasesOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>My Cases</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {myIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cases assigned to you.</p>
            ) : (
              myIncidents.map(i => (
                <div key={i.id} className="p-3 border rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{i.vehicleNumber || i.vehicleId}</span>
                    <span className="text-xs uppercase">{i.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{i.location}</div>
                  <div className="text-sm mt-1 line-clamp-2">{i.description}</div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}