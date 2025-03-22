import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { name, email, message } = await request.json();
    
    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    
    // Send email using Resend
    const data = await resend.emails.send({
      from: 'Contact Form <contact@eastgatejax.com>', // Using the verified domain
      to: process.env.CONTACT_EMAIL_RECIPIENT || 'nurbinabr@eastgatejax.com', // Can now send to any recipient
      subject: `New contact from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
      replyTo: email,
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 