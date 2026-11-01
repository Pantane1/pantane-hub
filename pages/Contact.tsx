// api/contact.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { senderName, senderEmail, senderMessage } = req.body;

  // Basic validation
  if (!senderName || !senderEmail || !senderMessage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Notify YOU
    await resend.emails.send({
      from: 'Contact Form <hello@pantane.is-a.dev>', // Your verified domain
      to: 'pantane254@gmail.com', // Your email
      replyTo: senderEmail, // CRITICAL: Allows you to hit "Reply" and go straight to the client
      subject: `New message from ${senderName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${senderName}</p>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${senderMessage}</p>
      `,
    });

    // 2. Auto-Reply to the CLIENT
    // (Ideally, you would use a React Email component here instead of raw HTML)
    await resend.emails.send({
      from: 'PANTANEHUB <hello@pantane.is-a.dev>',
      to: senderEmail,
      subject: 'Thanks for reaching out!',
      html: `
        <h2>Hi ${senderName},</h2>
        <p>Thanks for getting in touch! I've received your message and will get back to you within 24 hours.</p>
        <p>Here is a copy of what you sent:</p>
        <blockquote>${senderMessage}</blockquote>
        <p>Best regards,<br/>Pantane</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend Error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
