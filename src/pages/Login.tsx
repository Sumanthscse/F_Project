import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const validEmail = "sumanth@revenuedept.gov";
    const validPassword = "admin@123";

    if (email.trim() === validEmail && password === validPassword) {
      localStorage.setItem("auth_is_logged_in", "true");
      localStorage.setItem("auth_email", email.trim());
      toast({ title: "Welcome", description: "Login successful" });
      navigate("/", { replace: true });
    } else {
      toast({
        title: "Invalid credentials",
        description: "Please check your email and password",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EEF2FF] p-6">
      <Card className="w-full max-w-md p-8 rounded-2xl shadow-lg">
        <div className="mx-auto mb-6 h-12 w-12 rounded-xl bg-[#5A00FF] flex items-center justify-center">
          <span className="text-white text-xl">🛡️</span>
        </div>
        <h1 className="text-2xl font-bold text-center">Sand Transport Monitoring</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Mining & Revenue Department
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Please sign in to access the dashboard
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#5A00FF] hover:bg-[#4a00d6]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}


