import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Car, CheckCircle2, Clock, MapPin, Wrench } from "lucide-react";
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
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  licensePlate: z.string().min(2, "License plate is required"),
  vehicleYear: z.string().min(4, "Year is required"),
  vehicleMake: z.string().min(2, "Make is required"),
  vehicleModel: z.string().min(2, "Model is required"),
  isHighMileage: z.boolean(),
  date: z.date({ required_error: "Please select a date" }),
  timeSlot: z.string().min(1, "Please select a time"),
});

const BASE_PRICE = 79;
const HIGH_MILEAGE_UPCHARGE = 15;

function calculatePrice(isHighMileage: boolean): number {
  return BASE_PRICE + (isHighMileage ? HIGH_MILEAGE_UPCHARGE : 0);
}

function getServiceDescription(isHighMileage: boolean): string {
  return isHighMileage ? "Full Synthetic + High Mileage" : "Full Synthetic";
}

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
];

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
      address: "",
      licensePlate: "",
      vehicleYear: "",
      vehicleMake: "",
      vehicleModel: "",
      isHighMileage: false,
      timeSlot: "",
    },
  });

  const watchHighMileage = form.watch("isHighMileage");
  const calculatedPrice = calculatePrice(watchHighMileage);
  const serviceDescription = getServiceDescription(watchHighMileage);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const serviceType = getServiceDescription(data.isHighMileage);
      const price = calculatePrice(data.isHighMileage);
      
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
          serviceType,
          price,
          date: format(data.date, 'yyyy-MM-dd'),
          timeSlot: data.timeSlot,
          address: data.address,
          status: 'scheduled',
          mechanicId: null,
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
    if (step === 1) fieldsToValidate = ['licensePlate', 'vehicleYear', 'vehicleMake', 'vehicleModel'];
    if (step === 2) fieldsToValidate = ['date', 'timeSlot', 'address'];
    
    const result = await form.trigger(fieldsToValidate);
    if (result) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-display font-bold mb-2">Schedule Service</h1>
          <p className="text-muted-foreground">Complete the form below to book your mobile oil change.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10"></div>
          <div className={`flex flex-col items-center gap-2 bg-background px-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'}`}>1</div>
            <span className="text-xs font-bold uppercase">Vehicle</span>
          </div>
          <div className={`flex flex-col items-center gap-2 bg-background px-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'}`}>2</div>
            <span className="text-xs font-bold uppercase">Time</span>
          </div>
          <div className={`flex flex-col items-center gap-2 bg-background px-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'}`}>3</div>
            <span className="text-xs font-bold uppercase">Details</span>
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
                            <Input placeholder="ABC 1234" className="text-lg uppercase" {...field} data-testid="input-license-plate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input placeholder="2020" {...field} data-testid="input-year" />
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
                              <Input placeholder="Toyota" {...field} data-testid="input-make" />
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
                              <Input placeholder="Camry" {...field} data-testid="input-model" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isHighMileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Is your vehicle over 75,000 miles?</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <div 
                              className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50 ${field.value === false ? 'border-primary bg-primary/5' : 'border-muted'}`}
                              onClick={() => field.onChange(false)}
                              data-testid="mileage-under"
                            >
                              <div className="font-bold">Under 75,000</div>
                              <div className="text-sm text-muted-foreground">Full Synthetic</div>
                            </div>
                            <div 
                              className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50 ${field.value === true ? 'border-primary bg-primary/5' : 'border-muted'}`}
                              onClick={() => field.onChange(true)}
                              data-testid="mileage-over"
                            >
                              <div className="font-bold">Over 75,000</div>
                              <div className="text-sm text-muted-foreground">+${HIGH_MILEAGE_UPCHARGE} High Mileage</div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Your Estimated Price</p>
                      <p className="text-3xl font-display font-bold text-primary">${calculatedPrice}</p>
                      <p className="text-sm text-muted-foreground mt-1">{serviceDescription}</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Date, Time & Location */}
                {step === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Preferred Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                    data-testid="button-date"
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
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
                          <FormItem>
                            <FormLabel>Preferred Time</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-time">
                                  <SelectValue placeholder="Select a time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Location Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9" placeholder="1234 Main St, City, State" {...field} data-testid="input-address" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                            <Input placeholder="John Doe" {...field} data-testid="input-name" />
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
                              <Input placeholder="john@example.com" {...field} data-testid="input-customer-email" />
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
                              <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                      <h4 className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Summary
                      </h4>
                      <p><span className="font-semibold">Vehicle:</span> {form.getValues('vehicleYear')} {form.getValues('vehicleMake')} {form.getValues('vehicleModel')}</p>
                      <p><span className="font-semibold">Service:</span> {serviceDescription}</p>
                      <p><span className="font-semibold">When:</span> {form.getValues('date') ? format(form.getValues('date'), 'PPP') : ''} at {form.getValues('timeSlot')}</p>
                      <p><span className="font-semibold">Where:</span> {form.getValues('address')}</p>
                      <div className="border-t pt-2 mt-2">
                        <p className="text-lg font-bold">Total: <span className="text-primary">${calculatedPrice}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                  ) : (
                    <div></div>
                  )}
                  
                  {step < 3 ? (
                    <Button type="button" onClick={nextStep} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-next">Next Step</Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8"
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
