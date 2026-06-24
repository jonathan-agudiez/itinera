import { config } from '../config.js';

interface MailMessage {
  to: string;
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
