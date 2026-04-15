import nodemailer from 'nodemailer'
import { getEnv } from '@/config/env'
import { logger } from '@/config/logger'

export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }): Promise<void> {
  const env = getEnv()
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
      text: opts.text,
      html: opts.html ?? opts.text,
    })
  } catch (e) {
    logger.warn('Email send failed (dev SMTP may be unset)', e)
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await sendMail({
    to,
    subject: 'GarageFlow — Réinitialisation du mot de passe',
    text: `Votre code OTP : ${otp} (valide 15 minutes)`,
  })
}

export async function sendAppointmentConfirmation(to: string, when: string): Promise<void> {
  await sendMail({
    to,
    subject: 'GarageFlow — Confirmation de rendez-vous',
    text: `Votre rendez-vous est confirmé pour le ${when}.`,
  })
}

export async function sendPdfAttachment(
  to: string,
  subject: string,
  filename: string,
  buffer: Buffer,
): Promise<void> {
  const env = getEnv()
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
      to,
      subject,
      text: 'Veuillez trouver le document en pièce jointe.',
      attachments: [{ filename, content: buffer }],
    })
  } catch (e) {
    logger.warn('Email with PDF failed', e)
  }
}
