import nodemailer from 'nodemailer'
import { getEnv } from '@/config/env'
import { logger } from '@/config/logger'

async function sendViaResend(opts: {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: Array<{ filename: string; content: Buffer }>
}): Promise<boolean> {
  const env = getEnv()
  if (!env.RESEND_API_KEY) return false
  const resolvedTo =
    env.NODE_ENV === 'development' && env.EMAIL_DEV_REDIRECT
      ? env.EMAIL_DEV_REDIRECT
      : opts.to
  const resolvedSubject =
    env.NODE_ENV === 'development' &&
    env.EMAIL_DEV_REDIRECT &&
    env.EMAIL_DEV_REDIRECT !== opts.to
      ? `[DEV → ${opts.to}] ${opts.subject}`
      : opts.subject

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: env.RESEND_API_KEY },
    })
    await transporter.sendMail({
      from: opts.from ?? env.SMTP_FROM ?? 'GarageFlow <onboarding@resend.dev>',
      to: resolvedTo,
      subject: resolvedSubject,
      html: opts.html,
      attachments: opts.attachments,
    })
    return true
  } catch (e) {
    logger.warn('[Resend SMTP error]', e)
    return false
  }
}

async function sendViaSMTP(opts: {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{ filename: string; content: Buffer }>
}): Promise<void> {
  const env = getEnv()
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    logger.warn('[email] No SMTP configured — email not sent')
    return
  }
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  })
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text ?? '',
      html: opts.html,
      attachments: opts.attachments,
    })
  } catch (e) {
    logger.warn('[SMTP error]', e)
  }
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const sent = await sendViaResend({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    from: payload.from,
  })
  if (!sent) {
    await sendViaSMTP({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.subject,
    })
  }
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<void> {
  const html = opts.html ?? `<p>${opts.text}</p>`
  const sent = await sendViaResend({ to: opts.to, subject: opts.subject, html })
  if (!sent) {
    await sendViaSMTP({ to: opts.to, subject: opts.subject, html, text: opts.text })
  }
}

export async function sendPdfAttachment(
  to: string,
  subject: string,
  filename: string,
  buffer: Buffer,
): Promise<void> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2563EB;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">GarageFlow</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;">
        <p>Bonjour,</p>
        <p>Veuillez trouver votre document <strong>${subject}</strong>
        en pièce jointe.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:30px;">
          GarageFlow — Votre garage de confiance
        </p>
      </div>
    </div>
  `
  const attachments = [{ filename, content: buffer }]
  const sent = await sendViaResend({ to, subject, html, attachments })
  if (!sent) {
    await sendViaSMTP({ to, subject, html, text: subject, attachments })
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2563EB;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">GarageFlow</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;">
        <h2 style="color:#1e293b;">Réinitialisation du mot de passe</h2>
        <p>Votre code de vérification :</p>
        <div style="background:white;border:2px dashed #2563EB;
          border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
          <p style="font-size:36px;font-weight:bold;color:#2563EB;
            letter-spacing:8px;margin:0;">${otp}</p>
        </div>
        <p style="color:#64748b;font-size:14px;">
          Ce code expire dans 15 minutes.
        </p>
        <p style="color:#94a3b8;font-size:12px;margin-top:30px;">
          GarageFlow — Votre garage de confiance
        </p>
      </div>
    </div>
  `
  await sendMail({ to, subject: 'GarageFlow — Réinitialisation du mot de passe', text: `Votre code OTP : ${otp}`, html })
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  password: string,
  portalUrl: string,
): Promise<void> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2563EB;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">GarageFlow</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;">
        <h2 style="color:#1e293b;">Bienvenue, ${name} !</h2>
        <p>Votre compte a été créé avec succès.</p>
        <div style="background:white;border:1px solid #e2e8f0;
          border-radius:8px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#64748b;font-size:14px;">
            Vos identifiants :
          </p>
          <p style="margin:0;"><strong>Email :</strong> ${to}</p>
          <p style="margin:8px 0 0;">
            <strong>Mot de passe temporaire :</strong> ${password}
          </p>
        </div>
        <a href="${portalUrl}"
          style="background:#2563EB;color:white;padding:12px 24px;
          border-radius:6px;text-decoration:none;display:inline-block;">
          Accéder à mon espace
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:30px;">
          GarageFlow — Votre garage de confiance
        </p>
      </div>
    </div>
  `
  await sendMail({ to, subject: 'Bienvenue sur GarageFlow', text: `Bienvenue ${name}`, html })
}

export async function sendInvoiceEmailDirect(
  to: string,
  clientName: string,
  invoiceNumber: string,
  totalTTC: number,
  pdfUrl: string,
): Promise<void> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2563EB;padding:20px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">GarageFlow</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;">
        <h2 style="color:#1e293b;">Bonjour ${clientName}</h2>
        <p>Votre facture <strong>${invoiceNumber}</strong> est disponible.</p>
        <p>Montant TTC : <strong>${totalTTC.toFixed(3)} TND</strong></p>
        <a href="${pdfUrl}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Télécharger ma facture</a>
      </div>
    </div>
  `
  await sendMail({
    to,
    subject: `Votre facture ${invoiceNumber} - GarageFlow`,
    text: `Votre facture ${invoiceNumber} (${totalTTC.toFixed(3)} TND) est disponible : ${pdfUrl}`,
    html,
  })
}

export async function sendAppointmentConfirmation(
  to: string,
  when: string,
): Promise<void> {
  await sendMail({
    to,
    subject: 'GarageFlow — Confirmation de rendez-vous',
    text: `Votre rendez-vous est confirmé pour le ${when}.`,
    html: `<p>Votre rendez-vous est confirmé pour le <strong>${when}</strong>.</p>`,
  })
}

export async function sendPasswordResetEmail(to: string, otp: string): Promise<void> {
  await sendOtpEmail(to, otp)
}

export async function sendInvoiceViaWebhook(
  to: string,
  clientName: string,
  invoiceNumber: string,
  totalTTC: number,
  pdfUrl: string,
  invoiceId: string,
  garageId: string,
): Promise<boolean> {
  const env = getEnv()
  if (!env.N8N_INVOICE_WEBHOOK_URL) return false
  try {
    const axios = (await import('axios')).default
    await axios.post(env.N8N_INVOICE_WEBHOOK_URL, {
      email: to, clientName, invoiceNumber, totalTTC, pdfUrl,
      invoiceId, garageId,
    }, { timeout: 10_000 })
    return true
  } catch (e) {
    logger.warn('[n8n invoice webhook error]', e)
    return false
  }
}

export async function sendChatbotMessageToN8n(
  question: string,
  clientId: string,
  garageId: string,
  conversationId: string,
): Promise<boolean> {
  const env = getEnv()

  if (!env.N8N_CHATBOT_WEBHOOK_URL) {
    logger.warn('[chatbot] N8N_CHATBOT_WEBHOOK_URL not configured')
    return false
  }

  try {
    const axios = (await import('axios')).default
    const response = await axios.post(
      env.N8N_CHATBOT_WEBHOOK_URL,
      {
        question,
        clientId,
        garageId,
        conversationId,
      },
      {
        timeout: 15_000,
        headers: { 'Content-Type': 'application/json' },
      },
    )
    logger.info('[chatbot] n8n webhook called successfully', {
      status: response.status,
      conversationId,
    })
    return true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[chatbot] n8n webhook error', {
      message,
      url: env.N8N_CHATBOT_WEBHOOK_URL,
      conversationId,
    })
    return false
  }
}
