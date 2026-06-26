import { config } from '../config.js';

interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

interface AdminNotification {
  subject: string;
  html: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!config.RESEND_API_KEY) {
    console.info(`[mail disabled] To: ${message.to} | Subject: ${message.subject}`);
    console.info(message.html.replace(/<[^>]+>/g, ' '));
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      from: config.MAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mail provider rejected the request (${response.status}): ${body}`);
  }
}

export async function notifyAdmin(message: AdminNotification): Promise<void> {
  if (!config.ADMIN_EMAIL) {
    console.info(`[admin notification skipped] Subject: ${message.subject}`);
    return;
  }

  try {
    await sendMail({
      to: config.ADMIN_EMAIL,
      subject: message.subject,
      html: message.html,
    });
  } catch (error) {
    console.error('Admin email notification failed', error);
  }
}
