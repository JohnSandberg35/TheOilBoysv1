import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Calendar, Clock, Car, User, CheckCircle, Plus, Pencil, Trash2, Shield, Wrench, Loader2, LogOut, ChevronLeft, ChevronRight, Play, Square, Search, DollarSign, FileText, Phone, Mail, ImagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, isSameDay, parseISO, differenceInHours, differenceInMinutes } from "date-fns";

type Availability = {
  id: string;
  mechanicId: string;
  date: string;
  timeSlot: string;
  isAvailable: boolean;
};

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM"
];

type Appointment = {
  id: string;
  jobNumber?: number | null;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  licensePlate: string | null;
  licensePlateState?: string | null;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleType?: string | null;
  vehicleNumber?: number | null;
  serviceType: string;
  price: number;
  date: string;
  timeSlot: string;
  address: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  mechanicId: string | null;
  dateBilled?: string | null;
  dateReceived?: string | null;
  isPaid?: boolean | null;
  collector?: string | null;
  paymentMethod?: string | null;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt?: string;
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

type UserSession = {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'mechanic';
};

function CustomersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
  });

  const { data: customerDetails } = useQuery({
    queryKey: ['customer', selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      const response = await fetch(`/api/customers/${selectedCustomer}`);
      if (!response.ok) throw new Error('Failed to fetch customer details');
      return response.json();
    },
    enabled: !!selectedCustomer,
  });

  const filteredCustomers = customers.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Customers</h2>
          <p className="text-sm text-muted-foreground">Manage customer relationships and view service history</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Customer List ({filteredCustomers.length})</h3>
          {isLoading ? (
            <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
          ) : filteredCustomers.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No customers found</CardContent></Card>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredCustomers.map((customer: any) => (
                <Card
                  key={customer.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCustomer === customer.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedCustomer(customer.id)}
                >
                  <CardContent className="p-4">
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="w-3 h-3" />
                      {customer.email}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Customer Details</h3>
          {selectedCustomer && customerDetails ? (
            <Card>
              <CardHeader>
                <CardTitle>{customerDetails.name}</CardTitle>
                <CardDescription>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {customerDetails.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {customerDetails.phone}
                    </div>
                    {customerDetails.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {customerDetails.address}
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customerDetails.notes && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{customerDetails.notes}</p>
                  </div>
                )}
                <h4 className="font-semibold mb-2">Service History ({customerDetails.appointments?.length || 0})</h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {customerDetails.appointments?.map((apt: any) => (
                    <Card key={apt.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            Job #{apt.jobNumber || 'N/A'} - {format(new Date(apt.date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {apt.vehicleYear} {apt.vehicleMake} {apt.vehicleModel}
                            {apt.vehicleNumber && ` (Vehicle #${apt.vehicleNumber})`}
                          </div>
                          <div className="text-sm text-muted-foreground">${apt.price}</div>
                        </div>
                        <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a customer to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function JobRecordsTab() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/appointments/${id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: "Payment information updated" });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const response = await fetch(`/api/appointments/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to update notes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: "Notes updated" });
    },
  });

  const completedJobs = appointments
    .filter((a: any) => a.status === 'completed')
    .sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Job Records</h2>
        <p className="text-sm text-muted-foreground">Track payments and manage completed jobs</p>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
      ) : completedJobs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No completed jobs yet</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {completedJobs.map((job: any) => (
            <JobRecordCard
              key={job.id}
              job={job}
              onUpdatePayment={(data) => updatePaymentMutation.mutate({ id: job.id, data })}
              onUpdateNotes={(notes) => updateNotesMutation.mutate({ id: job.id, notes })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobRecordCard({ job, onUpdatePayment, onUpdateNotes }: { job: any; onUpdatePayment: (data: any) => void; onUpdateNotes: (notes: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    dateBilled: job.dateBilled || '',
    dateReceived: job.dateReceived || '',
    isPaid: job.isPaid || false,
    collector: job.collector || '',
    paymentMethod: job.paymentMethod || '',
  });
  const [notes, setNotes] = useState(job.notes || '');

  const handleSave = () => {
    onUpdatePayment(paymentData);
    onUpdateNotes(notes);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-bold text-lg">Job #{job.jobNumber || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">{job.customerName}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(job.date), 'MMM d, yyyy')} at {job.timeSlot}
            </div>
            <div className="text-sm text-muted-foreground">
              {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
              {job.vehicleNumber && ` (Vehicle #${job.vehicleNumber})`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">${job.price}</div>
            <Badge variant={paymentData.isPaid ? 'default' : 'secondary'} className="mt-2">
              {paymentData.isPaid ? 'Paid' : 'Unpaid'}
            </Badge>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date Billed</Label>
                <Input
                  type="date"
                  value={paymentData.dateBilled}
                  onChange={(e) => setPaymentData({ ...paymentData, dateBilled: e.target.value })}
                />
              </div>
              <div>
                <Label>Date Received</Label>
                <Input
                  type="date"
                  value={paymentData.dateReceived}
                  onChange={(e) => setPaymentData({ ...paymentData, dateReceived: e.target.value })}
                />
              </div>
              <div>
                <Label>Collector</Label>
                <Input
                  value={paymentData.collector}
                  onChange={(e) => setPaymentData({ ...paymentData, collector: e.target.value })}
                  placeholder="Who collected payment"
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Input
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  placeholder="Venmo, Cash, etc."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={paymentData.isPaid}
                onCheckedChange={(checked) => setPaymentData({ ...paymentData, isPaid: checked })}
              />
              <Label>Paid</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Job notes, customer preferences, issues, etc."
                rows={3}
              />
            </div>
            {job.followUpDate && (
              <div className="text-sm text-muted-foreground">
                Next change due: {format(new Date(job.followUpDate), 'MMM d, yyyy')}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date Billed:</span> {paymentData.dateBilled || 'Not set'}
              </div>
              <div>
                <span className="text-muted-foreground">Date Received:</span> {paymentData.dateReceived || 'Not set'}
              </div>
              <div>
                <span className="text-muted-foreground">Collector:</span> {paymentData.collector || 'Not set'}
              </div>
              <div>
                <span className="text-muted-foreground">Payment Method:</span> {paymentData.paymentMethod || 'Not set'}
              </div>
            </div>
            {notes && (
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Notes:</span> {notes}
              </div>
            )}
            {job.followUpDate && (
              <div className="mt-2 text-sm text-muted-foreground">
                Next change due: {format(new Date(job.followUpDate), 'MMM d, yyyy')}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Payment & Notes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ManagerPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSessions = async () => {
      try {
        const managerRes = await fetch("/api/manager/session");
        if (managerRes.ok) {
          const manager = await managerRes.json();
          setUser({ ...manager, role: 'manager' });
          return;
        }
      } catch {}
      
      try {
        const mechanicRes = await fetch("/api/mechanic/session");
        if (mechanicRes.ok) {
          const mechanic = await mechanicRes.json();
          setUser({ ...mechanic, role: 'mechanic' });
          return;
        }
      } catch {}
      
      setUser(null);
    };
    
    checkSessions().finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    if (user?.role === 'manager') {
      await fetch("/api/manager/logout", { method: "POST" });
    } else {
      await fetch("/api/mechanic/logout", { method: "POST" });
    }
    setUser(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!user) {
    return <UnifiedLogin onLogin={setUser} />;
  }

  if (user.role === 'mechanic') {
    return <TechnicianDashboard mechanic={user} onLogout={handleLogout} />;
  }

  return <ManagerDashboard manager={user} onLogout={handleLogout} />;
}

function UnifiedLogin({ onLogin }: { onLogin: (user: UserSession) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const managerRes = await fetch("/api/manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (managerRes.ok) {
        const manager = await managerRes.json();
        onLogin({ ...manager, role: 'manager' });
        toast({ title: `Welcome back, ${manager.name}!` });
        return;
      }

      const mechanicRes = await fetch("/api/mechanic/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (mechanicRes.ok) {
        const mechanic = await mechanicRes.json();
        onLogin({ ...mechanic, role: 'mechanic' });
        toast({ title: `Welcome back, ${mechanic.name}!` });
        return;
      }

      toast({ 
        title: "Invalid Credentials", 
        description: "Please check your email and password.",
        variant: "destructive"
      });
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
          <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">Team Portal</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                type="email" 
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-login-email"
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
                data-testid="input-login-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              disabled={isLoading}
              data-testid="button-login"
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
    <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Manager Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Welcome, {manager.name}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="min-h-[44px] w-full md:w-auto"
        >
          Logout
        </Button>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-5 min-h-[44px]">
          <TabsTrigger value="bookings" className="text-xs sm:text-sm">Bookings</TabsTrigger>
          <TabsTrigger value="customers" className="text-xs sm:text-sm">Customers</TabsTrigger>
          <TabsTrigger value="job-records" className="text-xs sm:text-sm">Job Records</TabsTrigger>
          <TabsTrigger value="mechanics" className="text-xs sm:text-sm">Technicians</TabsTrigger>
          <TabsTrigger value="time-tracking" className="text-xs sm:text-sm">Time Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-5 md:space-y-6">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold">{pending.length}</div>
                <p className="text-muted-foreground text-xs md:text-sm">Scheduled</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold">{inProgress.length}</div>
                <p className="text-muted-foreground text-xs md:text-sm">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold">{completed.length}</div>
                <p className="text-muted-foreground text-xs md:text-sm">Completed</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-lg md:text-xl font-bold">All Bookings</h2>
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
                    mechanics={mechanics}
                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })} 
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomersTab />
        </TabsContent>

        <TabsContent value="job-records" className="space-y-6">
          <JobRecordsTab />
        </TabsContent>

        <TabsContent value="mechanics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Manage Technicians</h2>
            <AddMechanicDialog />
          </div>
          
          {loadingMechanics ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mechanics.length === 0 ? (
                <p className="text-muted-foreground italic">No technicians added yet.</p>
              ) : (
                mechanics.map(mechanic => (
                  <MechanicCard key={mechanic.id} mechanic={mechanic} />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="time-tracking" className="space-y-6">
          <EmployeeTimeTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({ appointment, mechanics, onUpdateStatus }: { appointment: Appointment; mechanics: Mechanic[]; onUpdateStatus: (id: string, status: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const assignedMechanic = appointment.mechanicId 
    ? mechanics.find(m => m.id === appointment.mechanicId)
    : null;

  const assignMechanicMutation = useMutation({
    mutationFn: async (mechanicId: string) => {
      const response = await fetch(`/api/appointments/${appointment.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mechanicId }),
      });
      if (!response.ok) throw new Error('Failed to assign mechanic');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: "Technician assigned successfully" });
      setIsAssignDialogOpen(false);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to assign technician",
        variant: "destructive"
      });
    },
  });

  const statusColors: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <>
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
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  <span>
                    {assignedMechanic ? (
                      <span className="text-foreground">Technician: <strong>{assignedMechanic.name}</strong></span>
                    ) : (
                      <span className="text-orange-600">No technician assigned</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsAssignDialogOpen(true)}
                className="w-full min-h-[44px] text-base"
              >
                <User className="w-4 h-4 mr-2" />
                {appointment.mechanicId ? "Change Technician" : "Assign Technician"}
              </Button>
              {appointment.status === 'scheduled' && (
                <Button size="sm" onClick={() => onUpdateStatus(appointment.id, 'in-progress')} className="min-h-[44px] text-base">
                  Start
                </Button>
              )}
              {appointment.status === 'in-progress' && (
                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 min-h-[44px] text-base" onClick={() => onUpdateStatus(appointment.id, 'completed')}>
                  Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a technician to assign to this appointment:
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {mechanics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mechanics available</p>
              ) : (
                mechanics.map(mechanic => (
                  <button
                    key={mechanic.id}
                    onClick={() => assignMechanicMutation.mutate(mechanic.id)}
                    disabled={assignMechanicMutation.isPending}
                    className="w-full p-4 min-h-[60px] text-left border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 active:scale-[0.98] touch-manipulation"
                  >
                    <div className="font-medium">{mechanic.name}</div>
                    {mechanic.phone && (
                      <div className="text-sm text-muted-foreground">{mechanic.phone}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MechanicCard({ mechanic }: { mechanic: Mechanic }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/mechanics/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      toast({ title: "Technician removed" });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete technician. Please try again.",
        variant: "destructive" 
      });
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
          <div className="flex flex-wrap gap-2">
            <EditTechnicianScheduleDialog mechanic={mechanic} />
            <EditMechanicDialog mechanic={mechanic} />
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Technician</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{mechanic.name}</strong>? This action cannot be undone and will permanently remove this technician from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(mechanic.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TechnicianPhotoField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file (JPEG, PNG, WebP, or GIF)", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/upload/technician-photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      onChange(data.url);
      toast({ title: "Photo uploaded" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Photo</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
          {uploading ? "Uploading..." : "Upload from computer"}
        </Button>
        <span className="text-sm text-muted-foreground self-center">or paste URL below</span>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... or leave empty"
        disabled={disabled}
      />
      {value && (
        <div className="flex items-center gap-3 mt-2">
          <img src={value} alt="Preview" className="w-16 h-16 rounded-full object-cover border" />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} disabled={disabled}>
            Remove photo
          </Button>
        </div>
      )}
    </div>
  );
}

function AddMechanicDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        let msg = 'Failed to add technician';
        if (typeof err?.error === 'string') msg = err.error;
        else if (typeof err?.message === 'string') msg = err.message;
        else if (Array.isArray(err?.error)) msg = err.error.map((e: any) => e?.message).filter(Boolean).join(', ') || msg;
        throw new Error(msg);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] });
      toast({ title: "Technician added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to add technician",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setBio("");
    setPhotoUrl("");
    setBackgroundCheckVerified(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      email: email || null,
      password: password || null,
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
          Add Technician
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Technician</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="mechanic@example.com"
              required 
            />
            <p className="text-xs text-muted-foreground">Used for login and job assignment notifications</p>
          </div>
          <div className="space-y-2">
            <Label>Initial Password *</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Set a temporary password"
              required 
            />
            <p className="text-xs text-muted-foreground">Mechanic can change this after first login</p>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief description..." />
          </div>
          <TechnicianPhotoField value={photoUrl} onChange={setPhotoUrl} disabled={createMutation.isPending} />
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

function EditTechnicianScheduleDialog({ mechanic }: { mechanic: Mechanic }) {
  const [open, setOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekDays = [
    { dayOfWeek: 1, name: "Monday", short: "Mon" },
    { dayOfWeek: 2, name: "Tuesday", short: "Tue" },
    { dayOfWeek: 3, name: "Wednesday", short: "Wed" },
    { dayOfWeek: 4, name: "Thursday", short: "Thu" },
    { dayOfWeek: 5, name: "Friday", short: "Fri" },
    { dayOfWeek: 6, name: "Saturday", short: "Sat" },
    { dayOfWeek: 0, name: "Sunday", short: "Sun" },
  ];

  const { data: recurringSchedule = [], isLoading } = useQuery({
    queryKey: ["/api/manager/technicians", mechanic.id, "recurring-schedule"],
    queryFn: async () => {
      const res = await fetch(`/api/manager/technicians/${mechanic.id}/recurring-schedule`);
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    },
    enabled: open,
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedules: Array<{ dayOfWeek: number; timeSlot: string; isAvailable: boolean }>) => {
      const res = await fetch(`/api/manager/technicians/${mechanic.id}/recurring-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });
      if (!res.ok) throw new Error("Failed to save schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/technicians", mechanic.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      setPendingChanges(new Map());
      toast({ title: "Schedule saved", description: `${mechanic.name}'s weekly schedule has been updated.` });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save schedule", variant: "destructive" });
    },
  });

  const isSlotAvailable = (dayOfWeek: number, timeSlot: string) => {
    const key = `${dayOfWeek}|${timeSlot}`;
    if (pendingChanges.has(key)) return pendingChanges.get(key) === true;
    return recurringSchedule.some((s: { dayOfWeek: number; timeSlot: string; isAvailable: boolean }) =>
      s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot && s.isAvailable
    );
  };

  const handleToggle = (dayOfWeek: number, timeSlot: string) => {
    const key = `${dayOfWeek}|${timeSlot}`;
    setPendingChanges(prev => {
      const next = new Map(prev);
      next.set(key, !isSlotAvailable(dayOfWeek, timeSlot));
      return next;
    });
  };

  const handleSubmit = () => {
    const savedMap = new Map<string, boolean>();
    for (const s of recurringSchedule) {
      savedMap.set(`${s.dayOfWeek}|${s.timeSlot}`, s.isAvailable);
    }
    pendingChanges.forEach((isAvailable, key) => savedMap.set(key, isAvailable));

    const schedules: Array<{ dayOfWeek: number; timeSlot: string; isAvailable: boolean }> = [];
    for (const day of weekDays) {
      for (const slot of TIME_SLOTS) {
        if (savedMap.get(`${day.dayOfWeek}|${slot}`) === true) {
          schedules.push({ dayOfWeek: day.dayOfWeek, timeSlot: slot, isAvailable: true });
        }
      }
    }
    saveScheduleMutation.mutate(schedules);
  };

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit Schedule</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mechanic.name}'s Weekly Schedule</DialogTitle>
          <p className="text-sm text-muted-foreground">Click time slots to mark as available. Changes apply only to {mechanic.name}.</p>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left text-sm font-medium w-24">Time</th>
                    {weekDays.map(d => (
                      <th key={d.dayOfWeek} className="p-2 text-center font-medium min-w-[80px]">{d.short}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot} className="border-t">
                      <td className="p-2 text-muted-foreground">{slot}</td>
                      {weekDays.map(day => {
                        const available = isSlotAvailable(day.dayOfWeek, slot);
                        return (
                          <td key={`${day.dayOfWeek}-${slot}`} className="p-1">
                            <button
                              type="button"
                              onClick={() => handleToggle(day.dayOfWeek, slot)}
                              disabled={saveScheduleMutation.isPending}
                              className={`w-full h-9 rounded text-xs font-medium transition-colors ${
                                available ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              {available ? "Yes" : "-"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saveScheduleMutation.isPending || !hasPendingChanges}>
                {saveScheduleMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Schedule"}
              </Button>
            </div>
          </div>
        )}
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
          <DialogTitle>Edit Technician</DialogTitle>
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
          <TechnicianPhotoField value={photoUrl} onChange={setPhotoUrl} disabled={updateMutation.isPending} />
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

type EmployeeTimeData = {
  id: string;
  name: string;
  isClockedIn: boolean;
  currentCheckInTime: string | null;
  weeklyHours: number;
};

function EmployeeTimeTracking() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: employees = [], isLoading } = useQuery<EmployeeTimeData[]>({
    queryKey: ["/api/manager/employee-time-tracking", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/manager/employee-time-tracking?weekStart=${format(weekStart, "yyyy-MM-dd")}`);
      if (!res.ok) throw new Error("Failed to fetch employee time data");
      return res.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds to keep current status updated
  });

  const getCurrentElapsedTime = (checkInTime: string | null) => {
    if (!checkInTime) return null;
    const checkIn = new Date(checkInTime).getTime();
    const now = Date.now();
    const diff = Math.floor((now - checkIn) / 1000); // seconds
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Employee Time Tracking</h2>
          <p className="text-sm text-muted-foreground">View all employees' clock status and weekly hours</p>
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

      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No employees found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {employees.map((employee) => (
            <Card key={employee.id} className={employee.isClockedIn ? "border-l-4 border-l-green-500" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${employee.isClockedIn ? "bg-green-500" : "bg-gray-300"}`} />
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.isClockedIn ? (
                            <>
                              Clocked in at {employee.currentCheckInTime ? format(parseISO(employee.currentCheckInTime), "h:mm a") : ""}
                              {employee.currentCheckInTime && (
                                <span className="ml-2 text-green-600 font-medium">
                                  ({getCurrentElapsedTime(employee.currentCheckInTime)})
                                </span>
                              )}
                            </>
                          ) : (
                            "Not clocked in"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Weekly Hours</div>
                    <div className="text-2xl font-bold">{employee.weeklyHours.toFixed(1)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TechnicianDashboard({ mechanic, onLogout }: { mechanic: UserSession; onLogout: () => void }) {
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
        <div className="mb-6">
          <TimeTracker />
        </div>
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="schedule" data-testid="tab-schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="time" data-testid="tab-time">Time Tracker</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">My Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <AvailabilityScheduler />
          </TabsContent>

          <TabsContent value="time">
            <WeeklyTimeTracker />
          </TabsContent>

          <TabsContent value="jobs">
            <TechnicianJobsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
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
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (currentEntry && !currentEntry.checkOutTime) {
      const updateElapsed = () => {
        const checkIn = new Date(currentEntry.checkInTime).getTime();
        const now = Date.now();
        const diff = Math.floor((now - checkIn) / 1000);
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
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${isCheckedIn ? "text-green-600" : "text-gray-400"}`} />
              <div>
                <div className="text-sm font-medium text-gray-600">Time Tracker</div>
                {isCheckedIn ? (
                  <div className="text-2xl font-bold text-green-600">{elapsedTime}</div>
                ) : (
                  <div className="text-sm text-gray-500">Not on the clock</div>
                )}
              </div>
            </div>
          </div>
          <div>
            {isCheckedIn ? (
              <Button
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-check-out"
              >
                <Square className="w-4 h-4 mr-2" />
                Check Out
              </Button>
            ) : (
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-check-in"
              >
                <Play className="w-4 h-4 mr-2" />
                Check In
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type RecurringSchedule = {
  id: string;
  mechanicId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  timeSlot: string;
  isAvailable: boolean;
};

function AvailabilityScheduler() {
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Days of the week (Monday=1, Tuesday=2, ..., Sunday=0)
  const weekDays = [
    { dayOfWeek: 1, name: "Monday", short: "Mon" },
    { dayOfWeek: 2, name: "Tuesday", short: "Tue" },
    { dayOfWeek: 3, name: "Wednesday", short: "Wed" },
    { dayOfWeek: 4, name: "Thursday", short: "Thu" },
    { dayOfWeek: 5, name: "Friday", short: "Fri" },
    { dayOfWeek: 6, name: "Saturday", short: "Sat" },
    { dayOfWeek: 0, name: "Sunday", short: "Sun" },
  ];

  const { data: recurringSchedule = [], isLoading } = useQuery<RecurringSchedule[]>({
    queryKey: ["/api/mechanic/recurring-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/mechanic/recurring-schedule");
      if (!res.ok) throw new Error("Failed to fetch recurring schedule");
      return res.json();
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedules: Array<{ dayOfWeek: number; timeSlot: string; isAvailable: boolean }>) => {
      const res = await fetch("/api/mechanic/recurring-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });
      if (!res.ok) throw new Error("Failed to save schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mechanic/recurring-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] }); // Invalidate booking availability
      setPendingChanges(new Map());
      toast({
        title: "Success",
        description: "Weekly schedule saved! This will apply to all future weeks.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save schedule",
        variant: "destructive",
      });
    },
  });

  const isSlotAvailable = (dayOfWeek: number, timeSlot: string) => {
    const key = `${dayOfWeek}|${timeSlot}`;
    // Check pending changes first, then saved schedule
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key) === true;
    }
    return recurringSchedule.some(s => s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot && s.isAvailable);
  };

  const handleToggle = (dayOfWeek: number, timeSlot: string) => {
    const key = `${dayOfWeek}|${timeSlot}`;
    const currentlyAvailable = isSlotAvailable(dayOfWeek, timeSlot);
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(key, !currentlyAvailable);
      return newMap;
    });
  };

  const handleSubmit = () => {
    // Build schedule from all time slots
    const schedules: Array<{ dayOfWeek: number; timeSlot: string; isAvailable: boolean }> = [];
    
    // First, get all currently saved schedules
    const savedMap = new Map<string, boolean>();
    for (const s of recurringSchedule) {
      savedMap.set(`${s.dayOfWeek}|${s.timeSlot}`, s.isAvailable);
    }
    
    // Apply pending changes
    const finalMap = new Map(savedMap);
    pendingChanges.forEach((isAvailable, key) => {
      finalMap.set(key, isAvailable);
    });
    
    // Build schedule array - include all slots that are available
    for (const day of weekDays) {
      for (const slot of TIME_SLOTS) {
        const key = `${day.dayOfWeek}|${slot}`;
        const isAvailable = finalMap.get(key) === true;
        if (isAvailable) {
          schedules.push({
            dayOfWeek: day.dayOfWeek,
            timeSlot: slot,
            isAvailable: true,
          });
        }
      }
    }
    
    saveScheduleMutation.mutate(schedules);
  };

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg md:text-xl">📅 Weekly Schedule Template</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Set your recurring weekly schedule once. This will automatically apply to all future weeks.
          </CardDescription>
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
              disabled={saveScheduleMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto min-h-[44px]"
              data-testid="button-submit-availability"
            >
              {saveScheduleMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Save Schedule"
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
                    <th key={day.dayOfWeek} className="p-2 text-center text-sm font-medium min-w-[100px]">
                      <div className="font-bold text-base">{day.short}</div>
                      <div className="text-gray-500 text-xs mt-1">{day.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot} className="border-t">
                    <td className="p-2 text-sm text-gray-600 font-medium">{slot}</td>
                    {weekDays.map(day => {
                      const available = isSlotAvailable(day.dayOfWeek, slot);
                      return (
                        <td key={`${day.dayOfWeek}-${slot}`} className="p-1">
                          <button
                            onClick={() => handleToggle(day.dayOfWeek, slot)}
                            disabled={saveScheduleMutation.isPending}
                            className={`w-full h-10 md:h-10 min-h-[40px] rounded text-xs font-medium transition-colors active:scale-95 touch-manipulation ${
                              available 
                                ? "bg-green-500 text-white hover:bg-green-600" 
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            data-testid={`slot-${day.dayOfWeek}-${slot.replace(/\s/g, "-")}`}
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
            {!hasPendingChanges && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={saveScheduleMutation.isPending}
                  className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto min-h-[44px]"
                >
                  {saveScheduleMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    "Save Schedule"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TechnicianJobsList() {
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
