import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "Vaibhavi Malemath",
    email: localStorage.getItem("auth_email") || "sumanth@revenuedept.gov",
    department: "Revenue Department",
    username: "admin",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [pref, setPref] = useState({ email: true, push: true, weekly: false });

  useEffect(() => {
    const stored = localStorage.getItem("app_profile");
    if (stored) setProfile(JSON.parse(stored));
    const p = localStorage.getItem("app_prefs");
    if (p) setPref(JSON.parse(p));
  }, []);

  const saveProfile = () => {
    localStorage.setItem("app_profile", JSON.stringify(profile));
    toast({ title: "Profile updated" });
  };

  const changePassword = () => {
    const storedUser = localStorage.getItem("auth_username") || "admin";
    const storedPass = localStorage.getItem("auth_password") || "admin@123";
    if (passwords.current !== storedPass) {
      toast({ title: "Incorrect current password", variant: "destructive" });
      return;
    }
    if (passwords.next.length < 6 || passwords.next !== passwords.confirm) {
      toast({ title: "Passwords do not match or too short", variant: "destructive" });
      return;
    }
    localStorage.setItem("auth_username", profile.username || storedUser);
    localStorage.setItem("auth_password", passwords.next);
    setPasswords({ current: "", next: "", confirm: "" });
    toast({ title: "Password changed" });
  };

  const savePrefs = () => {
    localStorage.setItem("app_prefs", JSON.stringify(pref));
    toast({ title: "Preferences saved" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={profile.name} onChange={(e)=>setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} onChange={(e)=>setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={profile.department} onChange={(e)=>setProfile({ ...profile, department: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={profile.username} onChange={(e)=>setProfile({ ...profile, username: e.target.value })} />
            </div>
            <Button onClick={saveProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email alerts for incidents</p>
              </div>
              <Switch checked={pref.email} onCheckedChange={(v)=>setPref({ ...pref, email: !!v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get real-time notifications</p>
              </div>
              <Switch checked={pref.push} onCheckedChange={(v)=>setPref({ ...pref, push: !!v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Report Summaries</Label>
                <p className="text-sm text-muted-foreground">Weekly summary reports</p>
              </div>
              <Switch checked={pref.weekly} onCheckedChange={(v)=>setPref({ ...pref, weekly: !!v })} />
            </div>
            <Button variant="outline" onClick={savePrefs}>Save Preferences</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input id="current" type="password" value={passwords.current} onChange={(e)=>setPasswords({ ...passwords, current: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="next">New Password</Label>
                <Input id="next" type="password" value={passwords.next} onChange={(e)=>setPasswords({ ...passwords, next: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={passwords.confirm} onChange={(e)=>setPasswords({ ...passwords, confirm: e.target.value })} />
              </div>
            </div>
            <Button className="bg-primary" onClick={changePassword}>Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}