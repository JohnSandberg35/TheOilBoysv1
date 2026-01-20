import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, Car, User, CheckCircle, Wrench, Loader2, LogOut, ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";

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
      <header className="bg-black text-white py-3 md:py-4 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Wrench className="w-5 h-5 md:w-6 md:h-6" />
            <span className="font-semibold text-sm md:text-base">Technician Portal</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-gray-300 hidden sm:inline">Welcome, {mechanic.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-white hover:bg-gray-800 min-h-[44px]"
              data-testid="button-mechanic-logout"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-4 md:py-8 px-4 md:px-6">
        <div className="mb-4 md:mb-6">
          <TimeTracker />
        </div>
        <Tabs defaultValue="schedule" className="space-y-4 md:space-y-6">
          <TabsList className="bg-white border w-full grid grid-cols-3">
            <TabsTrigger value="schedule" data-testid="tab-schedule" className="text-xs sm:text-sm min-h-[44px]">My Schedule</TabsTrigger>
            <TabsTrigger value="time" data-testid="tab-time" className="text-xs sm:text-sm min-h-[44px]">Time Tracker</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs" className="text-xs sm:text-sm min-h-[44px]">My Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <AvailabilityScheduler />
          </TabsContent>

          <TabsContent value="time">
            <WeeklyTimeTracker />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

type TimeEntry = {
  id: string;
  mechanicId: string;
  checkInTime: string;
  checkOutTime: string | null;
};

function TimeTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

  const { data: currentEntry } = useQuery<TimeEntry | null>({
    queryKey: ["/api/mechanic/time-entry/current"],
    queryFn: async () => {
      const res = await fetch("/api/mechanic/time-entry/current");
      if (!res.ok) throw new Error("Failed to fetch time entry");
      return res.json();
    },
    refetchInterval: 1000, // Refetch every second to update elapsed time
  });

  useEffect(() => {
    if (currentEntry && !currentEntry.checkOutTime) {
      const updateElapsed = () => {
        const checkIn = new Date(currentEntry.checkInTime).getTime();
        const now = Date.now();
        const diff = Math.floor((now - checkIn) / 1000); // seconds
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setElapsedTime(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsedTime("00:00:00");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentEntry]);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mechanic/time-entry/check-in", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to check in");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanic/time-entry/current"] });
      toast({
        title: "Checked In",
        description: "You are now on the clock",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mechanic/time-entry/check-out", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to check out");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanic/time-entry/current"] });
      toast({
        title: "Checked Out",
        description: "You are now off the clock",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive",
      });
    },
  });

  const isCheckedIn = currentEntry && !currentEntry.checkOutTime;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="py-4 md:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <Clock className={`w-6 h-6 md:w-5 md:h-5 flex-shrink-0 ${isCheckedIn ? "text-green-600" : "text-gray-400"}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-600">Time Tracker</div>
              {isCheckedIn ? (
                <div className="text-xl md:text-2xl font-bold text-green-600">{elapsedTime}</div>
              ) : (
                <div className="text-sm text-gray-500">Not on the clock</div>
              )}
            </div>
          </div>
          <div className="w-full sm:w-auto">
            {isCheckedIn ? (
              <Button
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto min-h-[48px] text-base"
                data-testid="button-check-out"
              >
                <Square className="w-5 h-5 md:w-4 md:h-4 mr-2" />
                Check Out
              </Button>
            ) : (
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[48px] text-base"
                data-testid="button-check-in"
              >
                <Play className="w-5 h-5 md:w-4 md:h-4 mr-2" />
                Check In
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type TimeEntryRecord = {
  id: string;
  mechanicId: string;
  checkInTime: string;
  checkOutTime: string | null;
};

function WeeklyTimeTracker() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: entries = [], isLoading } = useQuery<TimeEntryRecord[]>({
    queryKey: ["/api/mechanic/time-entries", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/mechanic/time-entries?weekStart=${format(weekStart, "yyyy-MM-dd")}`);
      if (!res.ok) throw new Error("Failed to fetch time entries");
      return res.json();
    },
  });

  const { data: weeklyHours } = useQuery<{ hours: number }>({
    queryKey: ["/api/mechanic/weekly-hours", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/mechanic/weekly-hours?weekStart=${format(weekStart, "yyyy-MM-dd")}`);
      if (!res.ok) throw new Error("Failed to fetch weekly hours");
      return res.json();
    },
  });

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = checkOut ? new Date(checkOut).getTime() : Date.now();
    const diff = Math.floor((checkOutTime - checkInTime) / 1000); // seconds
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly Time Log</CardTitle>
            <CardDescription>View your time entries for the week</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setWeekStart(prev => addDays(prev, -7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              Week of {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setWeekStart(prev => addDays(prev, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium">Total Hours This Week</div>
              <div className="text-3xl font-bold text-blue-900">
                {weeklyHours?.hours.toFixed(1) || "0.0"} hours
              </div>
            </div>
            <Clock className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No time entries for this week
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">
                    {format(parseISO(entry.checkInTime), "EEEE, MMM d, yyyy")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Check In: {format(parseISO(entry.checkInTime), "h:mm a")}
                    {entry.checkOutTime && (
                      <> • Check Out: {format(parseISO(entry.checkOutTime), "h:mm a")}</>
                    )}
                    {!entry.checkOutTime && (
                      <> • <span className="text-green-600 font-medium">Currently Clocked In</span></>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatDuration(entry.checkInTime, entry.checkOutTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AvailabilityScheduler() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
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

  const batchUpdateMutation = useMutation({
    mutationFn: async (changes: Array<{ date: string; timeSlot: string; isAvailable: boolean }>) => {
      const res = await fetch("/api/mechanic/availability/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilities: changes }),
      });
      if (!res.ok) throw new Error("Failed to update availability");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanic/availability"] });
      setPendingChanges(new Map());
      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
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
    const key = `${dateStr}|${timeSlot}`;
    // Check pending changes first, then saved availability
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key) === true;
    }
    return availability.some(a => a.date === dateStr && a.timeSlot === timeSlot && a.isAvailable);
  };

  const handleToggle = (date: Date, timeSlot: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    // Use | separator since timeSlot may contain dashes
    const key = `${dateStr}|${timeSlot}`;
    const currentlyAvailable = isSlotAvailable(date, timeSlot);
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(key, !currentlyAvailable);
      return newMap;
    });
  };

  const handleSubmit = () => {
    const changes: Array<{ date: string; timeSlot: string; isAvailable: boolean }> = [];
    pendingChanges.forEach((isAvailable, key) => {
      // Key format: "date|timeSlot"
      const [date, ...timeSlotParts] = key.split('|');
      const timeSlot = timeSlotParts.join('|');
      changes.push({ date, timeSlot, isAvailable });
    });
    if (changes.length === 0) {
      toast({
        title: "No changes",
        description: "No availability changes to submit",
      });
      return;
    }
    batchUpdateMutation.mutate(changes);
  };

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl">Weekly Availability</CardTitle>
            <CardDescription className="text-xs md:text-sm">Click time slots to mark yourself as available, then click Submit to save changes</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setWeekStart(prev => addDays(prev, -7))}
              data-testid="button-prev-week"
              className="min-h-[44px] min-w-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs md:text-sm font-medium flex-1 sm:flex-none sm:min-w-[160px] text-center">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setWeekStart(prev => addDays(prev, 7))}
              data-testid="button-next-week"
              className="min-h-[44px] min-w-[44px]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {hasPendingChanges && (
        <CardContent className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <span className="text-sm text-yellow-800">
              You have {pendingChanges.size} pending change{pendingChanges.size !== 1 ? 's' : ''}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={batchUpdateMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto min-h-[44px]"
              data-testid="button-submit-availability"
            >
              {batchUpdateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </CardContent>
      )}
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
                            disabled={isPast || batchUpdateMutation.isPending}
                            className={`w-full h-10 md:h-10 min-h-[40px] rounded text-xs font-medium transition-colors active:scale-95 ${
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
                <CardContent className="py-4 md:py-4">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-base">{job.customerName}</span>
                        <Badge variant={job.status === "in-progress" ? "default" : "secondary"} className="text-xs">
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(job.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{job.timeSlot}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{job.address}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <Car className="w-4 h-4 flex-shrink-0" />
                        <span>{job.vehicleYear} {job.vehicleMake} {job.vehicleModel}</span>
                        {job.licensePlate && (
                          <Badge variant="outline" className="text-xs">{job.licensePlate}</Badge>
                        )}
                      </div>
                      <div className="text-sm pt-2 border-t">
                        <span className="text-gray-500">Service:</span> <span className="font-medium">{job.serviceType}</span>
                        <span className="ml-4 font-bold text-base">${job.price}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <Button
                        onClick={() => completeMutation.mutate(job.id)}
                        disabled={completeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 w-full min-h-[48px] text-base"
                        data-testid={`button-complete-${job.id}`}
                      >
                        <CheckCircle className="w-5 h-5 md:w-4 md:h-4 mr-2" />
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
          <div className="grid gap-3 md:gap-4">
            {completedJobs.slice(0, 10).map(job => (
              <Card key={job.id} className="border-l-4 border-l-green-500 bg-gray-50">
                <CardContent className="p-4 md:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <User className="w-5 h-5 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-base">{job.customerName}</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
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
                    <div className="text-lg md:text-lg font-medium">${job.price}</div>
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
