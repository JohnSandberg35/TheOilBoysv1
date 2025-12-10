import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppointments, Appointment } from "@/lib/store";
import { MapPin, Calendar, Clock, Car, User, CheckCircle, Navigation, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Mechanic() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  if (!isLoggedIn) {
    return <MechanicLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return <MechanicDashboard />;
}

function MechanicLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "truman@oilboys.com" && password === "admin") {
      onLogin();
      toast({ title: "Welcome back, Truman!" });
    } else {
      toast({ 
        title: "Invalid Credentials", 
        description: "Please check your email and password.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-md border-t-4 border-t-primary shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display font-bold">Mechanic Portal</CardTitle>
          <CardDescription>Enter your credentials to access your schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email ID</label>
              <Input 
                type="email" 
                placeholder="truman@oilboys.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">Demo Creds: truman@oilboys.com / admin</p>
        </CardFooter>
      </Card>
    </div>
  );
}

function MechanicDashboard() {
  const { appointments, updateStatus } = useAppointments();
  
  // Filter for 'my' appointments (mocked)
  const myAppointments = appointments; 

  const today = myAppointments.filter(a => a.date === '2025-12-15' || true); // Show all for demo
  const pending = today.filter(a => a.status === 'scheduled');
  const inProgress = today.filter(a => a.status === 'in-progress');
  const completed = today.filter(a => a.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Good Morning, Truman</h1>
          <p className="text-muted-foreground">You have {pending.length} scheduled jobs today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Report Issue
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Navigation className="w-4 h-4" />
            Optimize Route
          </Button>
        </div>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="completed">History</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {inProgress.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5 animate-pulse" />
                Current Job
              </h2>
              {inProgress.map(appt => (
                <JobCard key={appt.id} appointment={appt} onUpdateStatus={updateStatus} active />
              ))}
            </div>
          )}

          <h2 className="text-lg font-bold mb-4">Up Next</h2>
          <div className="grid gap-4">
            {pending.length === 0 ? (
              <p className="text-muted-foreground italic">No upcoming jobs scheduled.</p>
            ) : (
              pending.map(appt => (
                <JobCard key={appt.id} appointment={appt} onUpdateStatus={updateStatus} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <h2 className="text-lg font-bold mb-4">Completed Today</h2>
          <div className="grid gap-4">
            {completed.map(appt => (
              <JobCard key={appt.id} appointment={appt} onUpdateStatus={updateStatus} readOnly />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobCard({ 
  appointment, 
  onUpdateStatus, 
  active = false,
  readOnly = false 
}: { 
  appointment: Appointment, 
  onUpdateStatus: (id: string, status: Appointment['status']) => void,
  active?: boolean,
  readOnly?: boolean
}) {
  return (
    <Card className={`overflow-hidden transition-all ${active ? 'border-primary ring-1 ring-primary shadow-md' : 'hover:border-primary/50'}`}>
      <div className={`h-2 w-full ${active ? 'bg-primary' : readOnly ? 'bg-green-500' : 'bg-muted'}`} />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-4 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{appointment.customerName}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <User className="w-4 h-4" />
                  <span>Customer</span>
                </div>
              </div>
              <Badge variant={active ? "default" : "secondary"} className={active ? "bg-primary text-primary-foreground" : ""}>
                {appointment.time}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">{appointment.vehicle}</p>
                  <p className="text-muted-foreground">{appointment.serviceType}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Location</p>
                  <p className="text-muted-foreground">{appointment.address}</p>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(appointment.address)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-col justify-end gap-2 md:w-48">
              {appointment.status === 'scheduled' && (
                <Button onClick={() => onUpdateStatus(appointment.id, 'in-progress')} className="w-full">
                  Start Job
                </Button>
              )}
              {appointment.status === 'in-progress' && (
                <Button onClick={() => onUpdateStatus(appointment.id, 'completed')} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Job
                </Button>
              )}
              <Button variant="outline" className="w-full">
                Call Customer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
