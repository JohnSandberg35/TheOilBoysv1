import { Resend } from 'resend';

// Initialize Resend only if API key is provided (optional for development)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = 'The Oil Boys <bookings@theoilboys.org>';
const BUSINESS_EMAIL = 'theoilboysllc@gmail.com';

function formatContactMethod(method: string): string {
  switch (method) {
    case 'phone-text':
      return 'Phone (Text)';
    case 'phone-call':
      return 'Phone (Call)';
    case 'email':
      return 'Email';
    default:
      return method;
  }
}

// Log initialization status (only once at module load)
if (process.env.RESEND_API_KEY) {
  const keyPreview = process.env.RESEND_API_KEY.length > 10 
    ? process.env.RESEND_API_KEY.substring(0, 10) + '...' 
    : '***';
  console.log('✅ Resend email service initialized with API key:', keyPreview);
  console.log('   From email:', FROM_EMAIL);
  console.log('   Business email:', BUSINESS_EMAIL);
} else {
  console.warn('❌ Resend email service NOT initialized - RESEND_API_KEY not found in environment');
  console.warn('   To enable emails: Set RESEND_API_KEY in your .env file or environment variables');
}

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  preferredContactMethod?: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate?: string;
  serviceType: string;
  price: number;
  date: string;
  timeSlot: string;
  address: string;
  appointmentId?: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  console.log('sendBookingConfirmation called with data:', {
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    date: data.date,
    timeSlot: data.timeSlot,
    hasResend: !!resend
  });
  
  try {
    // Validate date format
    const appointmentDate = new Date(data.date);
    if (isNaN(appointmentDate.getTime())) {
      throw new Error(`Invalid date format: ${data.date}`);
    }
    
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
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
        
        ${data.appointmentId ? `
        <p style="color: #666666; font-size: 0.9em; margin-top: 15px;">
          Need to cancel? You can cancel your appointment up to 2 hours before your scheduled time. 
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel/${data.appointmentId}" style="color: #666666; text-decoration: underline;">Click here to cancel</a> or contact us at (385) 269-1482.
        </p>
        ` : ''}
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
        ${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
        ${data.preferredContactMethod ? `<p><strong>Preferred Contact:</strong> ${formatContactMethod(data.preferredContactMethod)}</p>` : ''}
        
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

    if (!resend) {
      console.warn('RESEND_API_KEY not set - emails will not be sent. This is okay for development.');
      console.log('Would send booking confirmation email to:', data.customerEmail);
      console.log('Would send notification email to:', BUSINESS_EMAIL);
      return { success: true, skipped: true };
    }

    // Validate email addresses
    if (!data.customerEmail || !data.customerEmail.includes('@')) {
      throw new Error(`Invalid customer email: ${data.customerEmail}`);
    }

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

    // Check for errors in the response
    if (customerResult.error) {
      throw new Error(`Customer email failed: ${JSON.stringify(customerResult.error)}`);
    }
    if (businessResult.error) {
      throw new Error(`Business email failed: ${JSON.stringify(businessResult.error)}`);
    }

    console.log('✅ Emails sent successfully');
    console.log('   Customer email ID:', customerResult.data?.id);
    console.log('   Business email ID:', businessResult.data?.id);
    return { success: true, customerResult, businessResult };
  } catch (error) {
    console.error('❌ Failed to send booking confirmation emails');
    // Log more details about the error
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.message.includes('domain') || error.message.includes('verified')) {
        console.error('   ⚠️  This might be a domain verification issue.');
        console.error('   Make sure bookings@theoilboys.org domain is verified in Resend.');
      }
      if (error.stack) {
        console.error('   Error stack:', error.stack);
      }
    } else {
      console.error('   Error:', error);
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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

interface MechanicAssignmentEmailData {
  mechanicName: string;
  mechanicEmail: string;
  customerName: string;
  customerPhone?: string;
  preferredContactMethod?: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate?: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  address: string;
}

export async function sendMechanicAssignmentEmail(data: MechanicAssignmentEmailData) {
  const appointmentDate = new Date(data.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mechanicEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">THE OIL BOYS</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Mobile Oil Change Service | Est. 2024</p>
      </div>
      
      <div style="padding: 30px; background: #f8f8f8;">
        <h2 style="color: #1a1a1a;">New Job Assigned</h2>
        <p>Hi ${data.mechanicName},</p>
        <p>You have been assigned a new job. Here are the details:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1a1a1a;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Appointment Details</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeSlot}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${data.address}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Customer Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${data.customerName}</p>
          ${data.customerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
          ${data.preferredContactMethod ? `<p style="margin: 5px 0;"><strong>Preferred Contact:</strong> ${formatContactMethod(data.preferredContactMethod)}</p>` : ''}
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
          ${data.licensePlate ? `<p style="margin: 5px 0;"><strong>License Plate:</strong> ${data.licensePlate}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceType}</p>
        </div>
        
        <p style="color: #666666; font-size: 0.9em;">
          Please log in to your technician portal to view full details and update job status.
        </p>
        <p style="color: #666666; font-size: 0.9em; margin-top: 10px;">
          <strong>Note:</strong> You will receive a reminder email on the day of the appointment with all details.
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

  if (!resend) {
    console.warn('RESEND_API_KEY not set - email will not be sent. This is okay for development.');
    console.log('Would send mechanic assignment email to:', data.mechanicEmail);
    return { success: true, skipped: true };
  }

  try {
    if (!data.mechanicEmail || !data.mechanicEmail.includes('@')) {
      throw new Error(`Invalid mechanic email: ${data.mechanicEmail}`);
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.mechanicEmail,
      subject: `New Job Assigned - ${formattedDate} at ${data.timeSlot}`,
      html: mechanicEmailHtml,
    });

    if (result.error) {
      throw new Error(`Mechanic email failed: ${JSON.stringify(result.error)}`);
    }

    console.log('✅ Mechanic assignment email sent successfully');
    console.log('   Mechanic email ID:', result.data?.id);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Failed to send mechanic assignment email');
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Error stack:', error.stack);
      }
    } else {
      console.error('   Error:', error);
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendTechnicianDayOfReminderEmail(data: MechanicAssignmentEmailData) {
  const appointmentDate = new Date(data.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reminderEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">THE OIL BOYS</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Mobile Oil Change Service | Est. 2024</p>
      </div>
      
      <div style="padding: 30px; background: #f8f8f8;">
        <h2 style="color: #1a1a1a;">📅 Appointment Reminder - Today</h2>
        <p>Hi ${data.mechanicName},</p>
        <p>You have an appointment scheduled for <strong>today</strong>. Here are the details:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1a1a1a;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Appointment Details</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeSlot}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${data.address}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Customer Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${data.customerName}</p>
          ${data.customerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
          ${data.preferredContactMethod ? `<p style="margin: 5px 0;"><strong>Preferred Contact:</strong> ${formatContactMethod(data.preferredContactMethod)}</p>` : ''}
          <p style="margin: 10px 0 5px 0; color: #666; font-size: 0.9em;"><em>Customer prefers to be contacted via ${formatContactMethod(data.preferredContactMethod || 'phone-call')}</em></p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
          ${data.licensePlate ? `<p style="margin: 5px 0;"><strong>License Plate:</strong> ${data.licensePlate}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceType}</p>
        </div>
        
        <p style="color: #666666; font-size: 0.9em; margin-top: 20px;">
          <strong>Remember:</strong> Contact the customer using their preferred method before arriving. 
          No need to confirm separately - this reminder email serves as your notification.
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

  if (!resend) {
    console.warn('RESEND_API_KEY not set - email will not be sent. This is okay for development.');
    console.log('Would send day-of reminder email to:', data.mechanicEmail);
    return { success: true, skipped: true };
  }

  try {
    if (!data.mechanicEmail || !data.mechanicEmail.includes('@')) {
      throw new Error(`Invalid technician email: ${data.mechanicEmail}`);
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.mechanicEmail,
      subject: `📅 Appointment Today - ${data.timeSlot} - ${data.customerName}`,
      html: reminderEmailHtml,
    });

    if (result.error) {
      throw new Error(`Technician reminder email failed: ${JSON.stringify(result.error)}`);
    }

    console.log('✅ Technician day-of reminder email sent successfully');
    console.log('   Technician email ID:', result.data?.id);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Failed to send technician day-of reminder email');
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Error stack:', error.stack);
      }
    } else {
      console.error('   Error:', error);
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

interface CustomerDayOfReminderEmailData {
  customerName: string;
  customerEmail: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  address: string;
  appointmentId?: string;
}

export async function sendCustomerDayOfReminderEmail(data: CustomerDayOfReminderEmailData) {
  const appointmentDate = new Date(data.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const customerReminderEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">THE OIL BOYS</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Mobile Oil Change Service | Est. 2024</p>
      </div>
      
      <div style="padding: 30px; background: #f8f8f8;">
        <h2 style="color: #1a1a1a;">📅 Appointment Reminder - Today</h2>
        <p>Hi ${data.customerName},</p>
        <p>This is a friendly reminder that you have an oil change service scheduled for <strong>today</strong>.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1a1a1a;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Appointment Details</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeSlot}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${data.address}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceType}</p>
        </div>
        
        <p style="color: #666666; font-size: 0.9em;">
          Please ensure your vehicle is accessible and parked in a suitable area for the technician to work. 
          Our technician will arrive at the scheduled time.
        </p>
        
        <p style="color: #666666; font-size: 0.9em;">
          Questions? Contact us at (385) 269-1482 or reply to this email.
        </p>
        
        ${data.appointmentId ? `
        <p style="color: #666666; font-size: 0.9em; margin-top: 15px;">
          Need to cancel? You can cancel your appointment up to 2 hours before your scheduled time. 
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel/${data.appointmentId}" style="color: #666666; text-decoration: underline;">Click here to cancel</a> or contact us at (385) 269-1482.
        </p>
        ` : ''}
      </div>
      
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <p style="color: #999999; margin: 0; font-size: 0.8em;">
          The Oil Boys LLC | Utah County, UT<br>
          (385) 269-1482 | theoilboysllc@gmail.com
        </p>
      </div>
    </div>
  `;

  if (!resend) {
    console.warn('RESEND_API_KEY not set - email will not be sent. This is okay for development.');
    console.log('Would send customer day-of reminder email to:', data.customerEmail);
    return { success: true, skipped: true };
  }

  try {
    if (!data.customerEmail || !data.customerEmail.includes('@')) {
      throw new Error(`Invalid customer email: ${data.customerEmail}`);
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `📅 Appointment Today - ${data.timeSlot} - The Oil Boys`,
      html: customerReminderEmailHtml,
    });

    if (result.error) {
      throw new Error(`Customer reminder email failed: ${JSON.stringify(result.error)}`);
    }

    console.log('✅ Customer day-of reminder email sent successfully');
    console.log('   Customer email ID:', result.data?.id);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Failed to send customer day-of reminder email');
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Error stack:', error.stack);
      }
    } else {
      console.error('   Error:', error);
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

interface CancellationEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  licensePlate?: string;
  date: string;
  timeSlot: string;
  address: string;
  serviceType: string;
  price: number;
}

export async function sendCancellationEmail(data: CancellationEmailData) {
  const appointmentDate = new Date(data.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const cancellationEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">THE OIL BOYS</h1>
        <p style="color: #cccccc; margin: 5px 0 0 0;">Mobile Oil Change Service | Est. 2024</p>
      </div>
      
      <div style="padding: 30px; background: #f8f8f8;">
        <h2 style="color: #d32f2f;">Appointment Cancelled</h2>
        <p>A customer has cancelled their appointment. Details below:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Customer Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${data.customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.customerEmail}</p>
          ${data.customerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Cancelled Appointment Details</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${data.timeSlot}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${data.address}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</p>
          ${data.licensePlate ? `<p style="margin: 5px 0;"><strong>License Plate:</strong> ${data.licensePlate}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceType}</p>
          <p style="margin: 5px 0;"><strong>Price:</strong> $${data.price}</p>
        </div>
      </div>
      
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <p style="color: #999999; margin: 0; font-size: 0.8em;">
          The Oil Boys LLC | Utah County, UT<br>
          (385) 269-1482 | theoilboysllc@gmail.com
        </p>
      </div>
    </div>
  `;

  if (!resend) {
    console.warn('RESEND_API_KEY not set - email will not be sent. This is okay for development.');
    console.log('Would send cancellation email to:', BUSINESS_EMAIL);
    return { success: true, skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: BUSINESS_EMAIL,
      subject: `Appointment Cancelled - ${data.customerName} - ${formattedDate}`,
      html: cancellationEmailHtml,
    });

    if (result.error) {
      throw new Error(`Cancellation email failed: ${JSON.stringify(result.error)}`);
    }

    console.log('✅ Cancellation email sent successfully');
    console.log('   Business email ID:', result.data?.id);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Failed to send cancellation email');
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Error stack:', error.stack);
      }
    } else {
      console.error('   Error:', error);
    }
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
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

  if (!resend) {
    console.warn('RESEND_API_KEY not set - email will not be sent. This is okay for development.');
    console.log('Would send completion email to:', data.customerEmail);
    return { success: true, skipped: true };
  }

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
