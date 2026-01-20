import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Car, CheckCircle2, Clock, MapPin, Wrench, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  streetAddress: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  licensePlate: z.string().min(4, "License plate is required").max(8, "License plate too long"),
  vehicleYear: z.string().min(4, "Year is required"),
  vehicleMake: z.string().min(2, "Make is required"),
  vehicleModel: z.string().min(2, "Model is required"),
  vehicleType: z.enum(["sedan-compact", "suv-truck"], { required_error: "Please select vehicle type" }),
  isHighMileage: z.boolean(),
  preferredContactMethod: z.enum(["phone-text", "phone-call", "email"], { required_error: "Please select preferred contact method" }),
  willBeHome: z.enum(["yes", "no"], { required_error: "Please select an option" }),
  date: z.date({ required_error: "Please select a date" }),
  timeSlot: z.string().min(1, "Please select a time"),
  mechanicId: z.string().optional(),
});

function formatLicensePlate(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length <= 3) return cleaned;
  return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 7);
}

const BASE_PRICE = 95;

function getServiceDescription(isHighMileage: boolean): string {
  return isHighMileage ? "Full Synthetic (High Mileage)" : "Full Synthetic";
}

const ALL_TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
];

// Helper function to normalize time slot format (convert "8:00 AM" to "08:00 AM")
function normalizeTimeSlot(slot: string): string {
  // If it's already in "08:00 AM" format, return as is
  if (/^\d{2}:\d{2}\s(AM|PM)$/i.test(slot)) {
    return slot.toUpperCase();
  }
  // If it's in "8:00 AM" format, pad the hour
  const match = slot.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
  if (match) {
    const hour = match[1].padStart(2, '0');
    const minute = match[2];
    const period = match[3].toUpperCase();
    return `${hour}:${minute} ${period}`;
  }
  return slot;
}

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      streetAddress: "",
      city: "",
      state: "UT",
      zipCode: "",
      licensePlate: "",
      vehicleYear: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleType: undefined,
      isHighMileage: false,
      preferredContactMethod: undefined,
      willBeHome: undefined,
      timeSlot: "",
      mechanicId: undefined,
    },
  });

  const selectedDate = form.watch("date");

  // Fetch available time slots with mechanics for selected date
  type AvailableSlot = {
    timeSlot: string;
    mechanics: Array<{ id: string; name: string }>;
  };

  const { data: availableSlotsData = [], isLoading: isLoadingSlots } = useQuery<AvailableSlot[]>({
    queryKey: ["/api/availability", selectedDate ? format(selectedDate, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(`/api/availability/${dateStr}`);
      if (!res.ok) throw new Error("Failed to fetch available slots");
      return res.json();
    },
    enabled: !!selectedDate,
  });

  // Get all time slots from ALL_TIME_SLOTS that have availability
  const timeSlotsWithAvailability = ALL_TIME_SLOTS.map(slot => {
    const available = availableSlotsData.find(s => normalizeTimeSlot(s.timeSlot) === slot);
    return {
      timeSlot: slot,
      isAvailable: !!available,
      mechanics: available?.mechanics || []
    };
  });

  const selectedTimeSlot = form.watch("timeSlot");
  
  // Get mechanics for selected time slot
  const selectedSlotData = availableSlotsData.find(s => normalizeTimeSlot(s.timeSlot) === selectedTimeSlot);
  const availableMechanics = selectedSlotData?.mechanics || [];

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const serviceType = getServiceDescription(data.isHighMileage);
      const fullAddress = `${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}`;
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
          licensePlate: data.licensePlate,
          vehicleYear: data.vehicleYear,
          vehicleMake: data.vehicleMake,
          vehicleModel: data.vehicleModel,
          vehicleType: data.vehicleType,
          serviceType,
          price: BASE_PRICE,
          date: format(data.date, 'yyyy-MM-dd'),
          timeSlot: data.timeSlot,
          address: fullAddress,
          preferredContactMethod: data.preferredContactMethod,
          willBeHome: data.willBeHome,
          status: 'scheduled',
          mechanicId: data.mechanicId && data.mechanicId !== 'any' ? data.mechanicId : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Confirmed!",
        description: "We've sent a confirmation to your email.",
      });
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createAppointmentMutation.mutate(values);
  }

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['licensePlate', 'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleType'];
    if (step === 2) fieldsToValidate = ['date', 'timeSlot', 'streetAddress', 'city', 'state', 'zipCode'];
    if (step === 3) fieldsToValidate = ['name', 'email', 'phone', 'preferredContactMethod', 'willBeHome'];
    
    const result = await form.trigger(fieldsToValidate);
    if (result) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="container mx-auto px-4 py-6 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Schedule Service</h1>
          <p className="text-sm md:text-base text-muted-foreground px-2">Complete the form below to book your mobile oil change.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8 md:mb-12 relative px-2">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10"></div>
          <div className={`flex flex-col items-center gap-1 md:gap-2 bg-background px-1 md:px-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm md:text-base ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'}`}>1</div>
            <span className="text-[10px] md:text-xs font-bold uppercase">Vehicle</span>
          </div>
          <div className={`flex flex-col items-center gap-1 md:gap-2 bg-background px-1 md:px-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm md:text-base ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'}`}>2</div>
            <span className="text-[10px] md:text-xs font-bold uppercase">Time</span>
          </div>
          <div className={`flex flex-col items-center gap-1 md:gap-2 bg-background px-1 md:px-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm md:text-base ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'}`}>3</div>
            <span className="text-[10px] md:text-xs font-bold uppercase">Details</span>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Step 1: Vehicle & Service */}
                {step === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <FormField
                      control={form.control}
                      name="licensePlate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Plate Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC 1234" 
                              className="text-base md:text-lg uppercase tracking-wider min-h-[44px]"
                              maxLength={8}
                              value={field.value}
                              onChange={(e) => {
                                const formatted = formatLicensePlate(e.target.value);
                                field.onChange(formatted);
                              }}
                              data-testid="input-license-plate" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input placeholder="2020" className="min-h-[44px] text-base" {...field} data-testid="input-year" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicleMake"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Make</FormLabel>
                            <FormControl>
                              <Input placeholder="Toyota" className="min-h-[44px] text-base" {...field} data-testid="input-make" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicleModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input placeholder="Camry" className="min-h-[44px] text-base" {...field} data-testid="input-model" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <div 
                              className={`cursor-pointer rounded-lg border-2 p-4 md:p-4 min-h-[44px] flex items-center justify-center text-center transition-all hover:border-primary/50 active:scale-95 ${field.value === "sedan-compact" ? 'border-primary bg-primary/5' : 'border-muted'}`}
                              onClick={() => field.onChange("sedan-compact")}
                              data-testid="vehicle-sedan-compact"
                            >
                              <div className="font-bold text-sm md:text-base">Sedan/Compact</div>
                            </div>
                            <div 
                              className={`cursor-pointer rounded-lg border-2 p-4 md:p-4 min-h-[44px] flex items-center justify-center text-center transition-all hover:border-primary/50 active:scale-95 ${field.value === "suv-truck" ? 'border-primary bg-primary/5' : 'border-muted'}`}
                              onClick={() => field.onChange("suv-truck")}
                              data-testid="vehicle-suv-truck"
                            >
                              <div className="font-bold text-sm md:text-base">SUV/Truck</div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isHighMileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Is your vehicle over 75,000 miles?</FormLabel>
                          <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div 
                              className={`cursor-pointer rounded-lg border-2 p-4 md:p-4 min-h-[44px] flex items-center justify-center text-center transition-all hover:border-primary/50 active:scale-95 ${field.value === false ? 'border-primary bg-primary/5' : 'border-muted'}`}
                              onClick={() => field.onChange(false)}
                              data-testid="mileage-under"
                            >
                              <div className="font-bold text-sm md:text-base">Under 75,000</div>
                            </div>
                            <div 
                              className={`cursor-pointer rounded-lg border-2 p-4 md:p-4 min-h-[44px] flex items-center justify-center text-center transition-all hover:border-primary/50 active:scale-95 ${field.value === true ? 'border-primary bg-primary/5' : 'border-muted'}`}
                              onClick={() => field.onChange(true)}
                              data-testid="mileage-over"
                            >
                              <div className="font-bold text-sm md:text-base">Over 75,000</div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Date, Time & Location */}
                {step === 2 && (
                  <div className="space-y-5 md:space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-base">Preferred Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal min-h-[44px] text-base ${!field.value && "text-muted-foreground"}`}
                                    data-testid="button-date"
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start" sideOffset={5}>
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeSlot"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-base">Preferred Time & Technician</FormLabel>
                            {!selectedDate ? (
                              <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
                                Please select a date first
                              </div>
                            ) : isLoadingSlots ? (
                              <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading available times...
                              </div>
                            ) : timeSlotsWithAvailability.filter(t => t.isAvailable).length === 0 ? (
                              <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
                                No technicians are available on this date. Please select another date.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3">
                                {timeSlotsWithAvailability.map((slot) => {
                                  if (!slot.isAvailable) return null;
                                  const isSelected = field.value === slot.timeSlot;
                                  return (
                                    <button
                                      key={slot.timeSlot}
                                      type="button"
                                      onClick={() => field.onChange(slot.timeSlot)}
                                      className={`p-4 min-h-[80px] border-2 rounded-lg text-left transition-all active:scale-[0.98] touch-manipulation ${
                                        isSelected
                                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                          : "border-muted hover:border-primary/50 active:bg-muted/50"
                                      }`}
                                    >
                                      <div className="font-semibold text-base mb-1">{slot.timeSlot}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {slot.mechanics.length === 0 ? (
                                          <span className="text-orange-600">No technicians</span>
                                        ) : (
                                          <>
                                            <span className="font-medium text-foreground">{slot.mechanics.length} technician{slot.mechanics.length !== 1 ? 's' : ''} available:</span> {slot.mechanics.map(m => m.name).join(", ")}
                                          </>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {field.value && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Selected: {field.value}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {selectedTimeSlot && availableMechanics.length > 0 && (
                      <FormField
                        control={form.control}
                        name="mechanicId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Technician (Optional)</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "any" ? undefined : value)} 
                              value={field.value || "any"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-mechanic" className="min-h-[44px] text-base">
                                  <SelectValue placeholder="Any available technician" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="any">Any available technician</SelectItem>
                                {availableMechanics.map((mechanic) => (
                                  <SelectItem key={mechanic.id} value={mechanic.id}>
                                    {mechanic.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                              {availableMechanics.length} technician{availableMechanics.length !== 1 ? 's' : ''} available at this time
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 min-h-[44px] text-base" placeholder="1234 Main St" {...field} data-testid="input-street-address" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Orem" className="min-h-[44px] text-base" {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-1">
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="UT" maxLength={2} className="uppercase min-h-[44px] text-base" {...field} data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="84058" maxLength={5} className="min-h-[44px] text-base" {...field} data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Contact Info */}
                {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="min-h-[44px] text-base" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" className="min-h-[44px] text-base" type="email" {...field} data-testid="input-customer-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" className="min-h-[44px] text-base" type="tel" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="preferredContactMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Contact Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contact-method" className="min-h-[44px] text-base">
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="phone-text">Phone (text)</SelectItem>
                              <SelectItem value="phone-call">Phone (call)</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="willBeHome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Will you be home while we service the vehicle?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-will-be-home" className="min-h-[44px] text-base">
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes! I'll be home.</SelectItem>
                              <SelectItem value="no">No (We'll reach out shortly with instructions)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                      <h4 className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Summary
                      </h4>
                      <p><span className="font-semibold">Vehicle:</span> {form.getValues('vehicleYear')} {form.getValues('vehicleMake')} {form.getValues('vehicleModel')}</p>
                      <p><span className="font-semibold">Service:</span> {getServiceDescription(form.getValues('isHighMileage'))}</p>
                      <p><span className="font-semibold">When:</span> {form.getValues('date') ? format(form.getValues('date'), 'PPP') : ''} at {form.getValues('timeSlot')}</p>
                      <p><span className="font-semibold">Where:</span> {form.getValues('streetAddress')}, {form.getValues('city')}, {form.getValues('state')} {form.getValues('zipCode')}</p>
                      <div className="border-t pt-2 mt-2">
                        <p className="text-lg font-bold">Total: <span className="text-primary">${BASE_PRICE}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t gap-3">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} className="min-h-[44px] flex-1 sm:flex-none">Back</Button>
                  ) : (
                    <div></div>
                  )}
                  
                  {step < 3 ? (
                    <Button type="button" onClick={nextStep} className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] flex-1 sm:flex-none" data-testid="button-next">Next Step</Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 min-h-[44px] flex-1 sm:flex-none"
                      disabled={createAppointmentMutation.isPending}
                      data-testid="button-confirm"
                    >
                      {createAppointmentMutation.isPending ? "Booking..." : "Confirm Booking"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
