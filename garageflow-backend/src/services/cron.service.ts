import cron from 'node-cron'
import mongoose from 'mongoose'
import { Appointment } from '@/models/Appointment.model'
import { Invoice } from '@/models/Invoice.model'
import { Part } from '@/models/Part.model'
import { User } from '@/models/User.model'
import { sendAppointmentConfirmation, sendMail } from '@/services/email.service'
import { logger } from '@/config/logger'
import { getSocketServer } from '@/sockets/emitter'
import { saveInAppNotification } from '@/services/notification.service'

export function startCronJobs(): void {
  cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const start = new Date(tomorrow)
        start.setHours(0, 0, 0, 0)
        const end = new Date(tomorrow)
        end.setHours(23, 59, 59, 999)
        const apts = await Appointment.find({
          status: 'confirmed',
          reminderSent: false,
          start: { $gte: start, $lte: end },
        })
          .populate('clientId')
          .lean()
        for (const a of apts) {
          const client = a.clientId as { email?: string } | undefined
          if (client?.email) {
            await sendAppointmentConfirmation(client.email, a.start.toISOString())
          }
          await Appointment.updateOne({ _id: a._id }, { reminderSent: true })
        }
      } catch (e) {
        logger.error('Cron appointment reminders', e)
      }
    },
    { timezone: 'Europe/Paris' },
  )

  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        const low = await Part.find({ $expr: { $lt: ['$stock', '$minStock'] } }).limit(50)
        const io = getSocketServer()
        for (const p of low) {
          if (io) {
            io.to(`garage:${p.garageId.toString()}`).emit('stock:lowAlert', {
              partId: p._id.toString(),
              partName: p.name,
              currentStock: p.stock,
            })
          }
          const mgr = await User.findOne({ garageId: p.garageId, role: 'manager' }).select('_id')
          if (mgr) {
            await saveInAppNotification({
              garageId: p.garageId,
              userId: mgr._id as mongoose.Types.ObjectId,
              type: 'low_stock',
              title: 'Stock bas',
              message: `${p.name} (${p.reference})`,
              link: '/stock',
              isRead: false,
            })
          }
        }
      } catch (e) {
        logger.error('Cron low stock', e)
      }
    },
    { timezone: 'Europe/Paris' },
  )

  cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        await Invoice.updateMany(
          { status: 'unpaid', dueDate: { $lt: today } },
          { status: 'overdue' },
        )
      } catch (e) {
        logger.error('Cron overdue invoices', e)
      }
    },
    { timezone: 'Europe/Paris' },
  )

  cron.schedule(
    '0 7 * * 1',
    async () => {
      try {
        const managers = await User.find({ role: 'manager', isActive: true }).select('email name')
        for (const m of managers) {
          if (m.email) {
            await sendMail({
              to: m.email,
              subject: 'GarageFlow — Résumé hebdomadaire',
              text: `Bonjour ${m.name}, voici votre résumé hebdomadaire (placeholder).`,
            })
          }
        }
      } catch (e) {
        logger.error('Cron weekly summary', e)
      }
    },
    { timezone: 'Europe/Paris' },
  )

  cron.schedule('0 * * * *', async () => {
    try {
      await User.updateMany(
        { passwordResetOtpExpires: { $lt: new Date() } },
        { $unset: { passwordResetOtpHash: 1, passwordResetOtpExpires: 1 } },
      )
    } catch (e) {
      logger.error('Cron otp cleanup', e)
    }
  })

  logger.info('Cron jobs scheduled')
}
