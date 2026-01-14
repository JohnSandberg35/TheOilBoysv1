import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'The Oil Boys <bookings@theoilboys.org>';
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
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">THE OIL BOYS</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Mobile Oil Change Service | Est. 2024</p>
      </div>
      
      <div style="padding: 30px; background: #f8f8f8;">
        <h2 style="color: #1a1a1a;">Booking Confirmed!</h2>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for booking with The Oil Boys! Here are your appointment details:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1a1a1a;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeSlot}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${data.address}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
          ${data.licensePlate ? `<p style="margin: 5px 0;"><strong>License Plate:</strong> ${data.licensePlate}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceType}</p>
          <p style="margin: 5px 0; font-size: 1.2em;"><strong>Total:</strong> <span style="color: #1a1a1a;">$${data.price}</span></p>
        </div>
        
        <p style="color: #666666; font-size: 0.9em;">
          Our technician will arrive at your location at the scheduled time. 
          Please ensure your vehicle is accessible and parked in a suitable area.
        </p>
        
        <p style="color: #666666; font-size: 0.9em;">
          Questions? Contact us at (385) 269-1482 or reply to this email.
        </p>
      </div>
      
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <p style="color: #999999; margin: 0; font-size: 0.8em;">
          The Oil Boys LLC | Utah County, UT<br>
          (385) 269-1482 | theoilboysllc@gmail.com
        </p>
      </div>
    </div>
  `;

  const businessEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">New Booking Received</h2>
      
      <div style="background: #f8f8f8; padding: 20px; border-radius: 8px;">
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

interface CompletionEmailData {
  customerName: string;
  customerEmail: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceType: string;
  mechanicName?: string;
}

export async function sendCompletionEmail(data: CompletionEmailData) {
  const completionEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">THE OIL BOYS</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Mobile Oil Change Service | Est. 2024</p>
      </div>
      
      <div style="padding: 30px; background: #f8f8f8;">
        <h2 style="color: #1a1a1a;">Service Completed!</h2>
        <p>Hi ${data.customerName},</p>
        <p>Great news! Your oil change service has been completed successfully.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Service Summary</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceType}</p>
          ${data.mechanicName ? `<p style="margin: 5px 0;"><strong>Technician:</strong> ${data.mechanicName}</p>` : ''}
        </div>
        
        <div style="background: #1a1a1a; color: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0;">Refer a Friend!</h3>
          <p>Get 20% off your next oil change when you refer a friend.</p>
        </div>
        
        <p style="color: #666666; font-size: 0.9em;">
          Thank you for choosing The Oil Boys! We appreciate your business.
        </p>
        
        <p style="color: #666666; font-size: 0.9em;">
          Questions or feedback? Contact us at (385) 269-1482 or reply to this email.
        </p>
      </div>
      
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <p style="color: #999999; margin: 0; font-size: 0.8em;">
          The Oil Boys LLC | Utah County, UT<br>
          (385) 269-1482 | theoilboysllc@gmail.com
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Service Completed - ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`,
      html: completionEmailHtml,
    });

    console.log('Completion email sent:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to send completion email:', error);
    return { success: false, error };
  }
}
