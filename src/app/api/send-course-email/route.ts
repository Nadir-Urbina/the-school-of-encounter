import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { subject, htmlContent, recipients, courseTitle, senderName } = await request.json()

    if (!subject || !htmlContent || !recipients?.length) {
      return NextResponse.json(
        { error: 'Subject, content, and at least one recipient are required' },
        { status: 400 }
      )
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:#4f46e5;padding:24px 32px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">The School of Encounter</p>
              <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">${courseTitle}</h1>
            </div>
            <div style="padding:32px;color:#374151;font-size:15px;line-height:1.6;">
              ${htmlContent}
            </div>
            <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You're receiving this because you're enrolled in <strong>${courseTitle}</strong>.<br/>
                The School of Encounter
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const firstName = senderName?.split(' ')[0] || 'Your Instructor'
    const fromDisplay = `${firstName} from TSOE <info@theschoolofencounter.com>`

    const batch = recipients.map((r: { name: string; email: string }) => ({
      from: fromDisplay,
      to: r.email,
      subject,
      html: emailHtml,
    }))

    const { data, error } = await resend.batch.send(batch)

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
    }

    return NextResponse.json({ success: true, sent: batch.length, data })
  } catch (error) {
    console.error('Error sending course email:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
