import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Calendar, Clock, Car, User, CheckCircle, Plus, Pencil, Trash2, Shield, Wrench, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

type Mechanic = {
  id: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  oilChangeCount: number;
  backgroundCheckVerified: boolean;
  isPublic: boolean;
};

type Manager = {
  id: string;
  email: string;
  name: string;
};

export default function ManagerPage() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch("/api/manager/session")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then(setManager)
      .catch(() => setManager(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/manager/logout", { method: "POST" });
    setManager(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!manager) {
    return <ManagerLogin onLogin={setManager} />;
  }

  return <ManagerDashboard manager={manager} onLogout={handleLogout} />;
}

function ManagerLogin({ onLogin }: { onLogin: (manager: Manager) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/manager/login", {
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

      const manager = await response.json();
      onLogin(manager);
      toast({ title: `Welcome back, ${manager.name}!` });
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
    <div className="min-h-[80vh] flex items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-md border-t-4 border-t-primary shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display font-bold">Manager Portal</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                type="email" 
                placeholder="truman@oilboys.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-manager-email"
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
                data-testid="input-manager-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              disabled={isLoading}
              data-testid="button-manager-login"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ManagerDashboard({ manager, onLogout }: { manager: Manager; onLogout: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
  });

  const { data: mechanics = [], isLoading: loadingMechanics } = useQuery<Mechanic[]>({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const response = await fetch('/api/mechanics');
      if (!response.ok) throw new Error('Failed to fetch mechanics');
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: "Status updated successfully" });
    },
  });

  const pending = appointments.filter(a => a.status === 'scheduled');
  const inProgress = appointments.filter(a => a.status === 'in-progress');
  const completed = appointments.filter(a => a.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {manager.name}</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{pending.length}</div>
                <p className="text-muted-foreground text-sm">Scheduled</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{inProgress.length}</div>
                <p className="text-muted-foreground text-sm">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{completed.length}</div>
                <p className="text-muted-foreground text-sm">Completed</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-bold">All Bookings</h2>
          {loadingAppointments ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid gap-4">
              {appointments.length === 0 ? (
                <p className="text-muted-foreground italic">No bookings yet.</p>
              ) : (
                appointments.map(appt => (
                  <BookingCard 
                    key={appt.id} 
                    appointment={appt} 
                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })} 
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mechanics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Manage Mechanics</h2>
            <AddMechanicDialog />
          </div>
          
          {loadingMechanics ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mechanics.length === 0 ? (
                <p className="text-muted-foreground italic">No mechanics added yet.</p>
              ) : (
                mechanics.map(mechanic => (
                  <MechanicCard key={mechanic.id} mechanic={mechanic} />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({ appointment, onUpdateStatus }: { appointment: Appointment; onUpdateStatus: (id: string, status: string) => void }) {
  const statusColors: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{appointment.customerName}</h3>
              <Badge className={statusColors[appointment.status] || ''}>
                {appointment.status}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span>{appointment.vehicleYear} {appointment.vehicleMake} {appointment.vehicleModel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{appointment.date} at {appointment.timeSlot}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{appointment.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">${appointment.price}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {appointment.status === 'scheduled' && (
              <Button size="sm" onClick={() => onUpdateStatus(appointment.id, 'in-progress')}>
                Start
              </Button>
            )}
            {appointment.status === 'in-progress' && (
              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(appointment.id, 'completed')}>
                Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MechanicCard({ mechanic }: { mechanic: Mechanic }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/mechanics/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      toast({ title: "Mechanic removed" });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const response = await fetch(`/api/mechanics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      toast({ title: "Visibility updated" });
    },
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            {mechanic.photoUrl ? (
              <img src={mechanic.photoUrl} alt={mechanic.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{mechanic.name}</h3>
              {mechanic.backgroundCheckVerified && (
                <Shield className="w-4 h-4 text-green-600" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{mechanic.bio || 'No bio'}</p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Wrench className="w-4 h-4" />
              <span>{mechanic.oilChangeCount} oil changes</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Switch 
              checked={mechanic.isPublic} 
              onCheckedChange={(checked) => togglePublicMutation.mutate({ id: mechanic.id, isPublic: checked })}
            />
            <span className="text-sm text-muted-foreground">Show on website</span>
          </div>
          <div className="flex gap-2">
            <EditMechanicDialog mechanic={mechanic} />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate(mechanic.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddMechanicDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [backgroundCheckVerified, setBackgroundCheckVerified] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/mechanics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      toast({ title: "Mechanic added successfully" });
      setOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setBio("");
    setPhotoUrl("");
    setBackgroundCheckVerified(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      phone: phone || null,
      bio: bio || null,
      photoUrl: photoUrl || null,
      backgroundCheckVerified,
      isPublic: true,
      oilChangeCount: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Mechanic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Mechanic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief description..." />
          </div>
          <div className="space-y-2">
            <Label>Photo URL</Label>
            <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={backgroundCheckVerified} onCheckedChange={setBackgroundCheckVerified} />
            <Label>Background Check Verified</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Mechanic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMechanicDialog({ mechanic }: { mechanic: Mechanic }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(mechanic.name);
  const [phone, setPhone] = useState(mechanic.phone || "");
  const [bio, setBio] = useState(mechanic.bio || "");
  const [photoUrl, setPhotoUrl] = useState(mechanic.photoUrl || "");
  const [oilChangeCount, setOilChangeCount] = useState(mechanic.oilChangeCount);
  const [backgroundCheckVerified, setBackgroundCheckVerified] = useState(mechanic.backgroundCheckVerified);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/mechanics/${mechanic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      toast({ title: "Mechanic updated successfully" });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      phone: phone || null,
      bio: bio || null,
      photoUrl: photoUrl || null,
      oilChangeCount,
      backgroundCheckVerified,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Mechanic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief description..." />
          </div>
          <div className="space-y-2">
            <Label>Photo URL</Label>
            <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Oil Changes Completed</Label>
            <Input type="number" value={oilChangeCount} onChange={(e) => setOilChangeCount(parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={backgroundCheckVerified} onCheckedChange={setBackgroundCheckVerified} />
            <Label>Background Check Verified</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
