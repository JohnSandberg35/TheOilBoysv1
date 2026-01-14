import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, Car, User, CheckCircle, Wrench, Loader2, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";

type MechanicSession = {
  id: string;
  email: string;
  name: string;
};

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  licensePlate: string | null;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceType: string;
  price: number;
  date: string;
  timeSlot: string;
  address: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  mechanicId: string | null;
};

type Availability = {
  id: string;
  mechanicId: string;
  date: string;
  timeSlot: string;
  isAvailable: boolean;
};

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

export default function MechanicPage() {
  const [mechanic, setMechanic] = useState<MechanicSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch("/api/mechanic/session")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then(setMechanic)
      .catch(() => setMechanic(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/mechanic/logout", { method: "POST" });
    setMechanic(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!mechanic) {
    return <MechanicLogin onLogin={setMechanic} />;
  }

  return <MechanicDashboard mechanic={mechanic} onLogout={handleLogout} />;
}

function MechanicLogin({ onLogin }: { onLogin: (mechanic: MechanicSession) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/mechanic/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        toast({ 
          title: "Invalid Credentials", 
          description: "Please check your email and password.",
          variant: "destructive"
        });
        return;
      }

      const mechanic = await response.json();
      onLogin(mechanic);
      toast({ title: `Welcome back, ${mechanic.name}!` });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white">
      <Card className="w-full max-w-md border-2 border-black">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Technician Portal</CardTitle>
          <CardDescription>Sign in to manage your schedule and jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-mechanic-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-mechanic-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={isLoading}
              data-testid="button-mechanic-login"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function MechanicDashboard({ mechanic, onLogout }: { mechanic: MechanicSession; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="w-6 h-6" />
            <span className="font-semibold">Technician Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">Welcome, {mechanic.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-white hover:bg-gray-800"
              data-testid="button-mechanic-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="schedule" data-testid="tab-schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">My Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <AvailabilityScheduler />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AvailabilityScheduler() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: availability = [], isLoading } = useQuery<Availability[]>({
    queryKey: ["/api/mechanic/availability", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/mechanic/availability?fromDate=${format(weekStart, "yyyy-MM-dd")}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ date, timeSlot, isAvailable }: { date: string; timeSlot: string; isAvailable: boolean }) => {
      const res = await fetch("/api/mechanic/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, timeSlot, isAvailable }),
      });
      if (!res.ok) throw new Error("Failed to update availability");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanic/availability"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  const isSlotAvailable = (date: Date, timeSlot: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availability.some(a => a.date === dateStr && a.timeSlot === timeSlot && a.isAvailable);
  };

  const handleToggle = (date: Date, timeSlot: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const currentlyAvailable = isSlotAvailable(date, timeSlot);
    toggleMutation.mutate({ date: dateStr, timeSlot, isAvailable: !currentlyAvailable });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly Availability</CardTitle>
            <CardDescription>Click time slots to mark yourself as available</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setWeekStart(prev => addDays(prev, -7))}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setWeekStart(prev => addDays(prev, 7))}
              data-testid="button-next-week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-sm font-medium text-gray-500 w-24">Time</th>
                  {weekDays.map(day => (
                    <th key={day.toISOString()} className="p-2 text-center text-sm font-medium min-w-[100px]">
                      <div>{format(day, "EEE")}</div>
                      <div className="text-gray-500">{format(day, "MMM d")}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot} className="border-t">
                    <td className="p-2 text-sm text-gray-600">{slot}</td>
                    {weekDays.map(day => {
                      const available = isSlotAvailable(day, slot);
                      const isPast = day < new Date() && !isSameDay(day, new Date());
                      return (
                        <td key={day.toISOString()} className="p-1">
                          <button
                            onClick={() => !isPast && handleToggle(day, slot)}
                            disabled={isPast || toggleMutation.isPending}
                            className={`w-full h-10 rounded text-xs font-medium transition-colors ${
                              isPast 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : available 
                                  ? "bg-green-500 text-white hover:bg-green-600" 
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            data-testid={`slot-${format(day, "yyyy-MM-dd")}-${slot.replace(/\s/g, "-")}`}
                          >
                            {available ? "Available" : "-"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JobsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/mechanic/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/mechanic/jobs");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/mechanic/jobs/${jobId}/complete`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to complete job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanic/jobs"] });
      toast({
        title: "Job Completed",
        description: "The customer has been notified via email.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete job",
        variant: "destructive",
      });
    },
  });

  const scheduledJobs = jobs.filter(j => j.status === "scheduled" || j.status === "in-progress");
  const completedJobs = jobs.filter(j => j.status === "completed");

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Upcoming Jobs ({scheduledJobs.length})</h2>
        {scheduledJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No upcoming jobs assigned to you
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scheduledJobs.map(job => (
              <Card key={job.id} className="border-l-4 border-l-black">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{job.customerName}</span>
                        <Badge variant={job.status === "in-progress" ? "default" : "secondary"}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(job.date)}</span>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{job.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{job.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Car className="w-4 h-4" />
                        <span>{job.vehicleYear} {job.vehicleMake} {job.vehicleModel}</span>
                        {job.licensePlate && (
                          <Badge variant="outline" className="ml-2">{job.licensePlate}</Badge>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Service:</span> {job.serviceType}
                        <span className="ml-4 font-medium">${job.price}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => completeMutation.mutate(job.id)}
                        disabled={completeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-complete-${job.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Completed Jobs ({completedJobs.length})</h2>
        {completedJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No completed jobs yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedJobs.slice(0, 10).map(job => (
              <Card key={job.id} className="border-l-4 border-l-green-500 bg-gray-50">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{job.customerName}</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(job.date)} at {job.timeSlot}
                      </div>
                      <div className="text-sm text-gray-600">
                        {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                      </div>
                    </div>
                    <div className="text-lg font-medium">${job.price}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
