import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Calendar, Clock, MapPin, Car } from "lucide-react";
import { format } from "date-fns";

export default function CancelAppointment() {
  const [, params] = useRoute("/cancel/:id");
  const [, setLocation] = useLocation();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!params?.id) {
      setError("Invalid appointment ID");
      setLoading(false);
      return;
    }

    // Fetch appointment details
    fetch(`/api/appointments/${params.id}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Appointment not found");
          }
          throw new Error("Failed to load appointment");
        }
        return res.json();
      })
      .then(data => {
        if (data.status === 'cancelled') {
          setError("This appointment has already been cancelled");
        } else {
          setAppointment(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load appointment");
        setLoading(false);
      });
  }, [params?.id]);

  const handleCancel = async () => {
    if (!params?.id) return;

    setCancelling(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${params.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel appointment");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading appointment details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => setLocation("/")}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Appointment Cancelled
            </CardTitle>
            <CardDescription>
              Your appointment has been successfully cancelled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                A cancellation notification has been sent to The Oil Boys. 
                We're sorry to see you go, but we hope to serve you in the future!
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => setLocation("/")}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const appointmentDate = appointment ? new Date(appointment.date) : null;
  const formattedDate = appointmentDate ? format(appointmentDate, 'EEEE, MMMM d, yyyy') : '';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cancel Appointment</CardTitle>
          <CardDescription>
            Are you sure you want to cancel this appointment?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointment && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formattedDate} at {appointment.timeSlot}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.address}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Vehicle</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.vehicleYear} {appointment.vehicleMake} {appointment.vehicleModel}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Cancellations must be made at least 2 hours before your scheduled appointment time. 
              If you cancel less than 2 hours before, please contact us directly at (385) 269-1482.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/")}
              disabled={cancelling}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Appointment"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
