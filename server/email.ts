import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev';
const BUSINESS_EMAIL = 'theoilboysllc@gmail.com';

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate?: string;
  serviceType: string;
  price: number;
  date: string;
  timeSlot: string;
  address: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const customerEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">The Oil Boys</h1>
        <p style="color: #fbbf24; margin: 5px 0 0 0;">Mobile Oil Change Service</p>
      </div>
      
      <div style="padding: 30px; background: #f8fafc;">
        <h2 style="color: #1e40af;">Booking Confirmed!</h2>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for booking with The Oil Boys! Here are your appointment details:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1e40af;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeSlot}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${data.address}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
          ${data.licensePlate ? `<p style="margin: 5px 0;"><strong>License Plate:</strong> ${data.licensePlate}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceType}</p>
          <p style="margin: 5px 0; font-size: 1.2em;"><strong>Total:</strong> <span style="color: #1e40af;">$${data.price}</span></p>
        </div>
        
        <p style="color: #64748b; font-size: 0.9em;">
          Our technician will arrive at your location at the scheduled time. 
          Please ensure your vehicle is accessible and parked in a suitable area.
        </p>
        
        <p style="color: #64748b; font-size: 0.9em;">
          Questions? Contact us at (385) 269-1482 or reply to this email.
        </p>
      </div>
      
      <div style="background: #1e293b; padding: 20px; text-align: center;">
        <p style="color: #94a3b8; margin: 0; font-size: 0.8em;">
          The Oil Boys LLC | Utah County, UT<br>
          (385) 269-1482 | theoilboysllc@gmail.com
        </p>
      </div>
    </div>
  `;

  const businessEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Booking Received</h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${data.customerName}</p>
        <p><strong>Email:</strong> ${data.customerEmail}</p>
        
        <h3>Appointment Details</h3>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${data.timeSlot}</p>
        <p><strong>Location:</strong> ${data.address}</p>
        
        <h3>Vehicle</h3>
        <p><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
        ${data.licensePlate ? `<p><strong>License Plate:</strong> ${data.licensePlate}</p>` : ''}
        <p><strong>Service:</strong> ${data.serviceType}</p>
        <p><strong>Price:</strong> $${data.price}</p>
      </div>
    </div>
  `;

  try {
    const [customerResult, businessResult] = await Promise.all([
      resend.emails.send({
        from: FROM_EMAIL,
        to: data.customerEmail,
        subject: `Booking Confirmed - ${formattedDate} at ${data.timeSlot}`,
        html: customerEmailHtml,
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: BUSINESS_EMAIL,
        subject: `New Booking: ${data.customerName} - ${formattedDate}`,
        html: businessEmailHtml,
      })
    ]);

    console.log('Emails sent successfully:', { customerResult, businessResult });
    return { success: true, customerResult, businessResult };
  } catch (error) {
    console.error('Failed to send emails:', error);
    return { success: false, error };
  }
}
