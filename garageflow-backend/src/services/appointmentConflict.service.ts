import mongoose from 'mongoose'
import { Appointment } from '@/models/Appointment.model'

/**
 * Trouve un rendez-vous du même garage dont l'intervalle [start, end] chevauche [rangeStart, rangeEnd].
 * Les RDV annulés ne bloquent pas la réservation.
 */
export async function findOverlappingAppointment(
  garageId: mongoose.Types.ObjectId,
  rangeStart: Date,
  rangeEnd: Date,
  excludeAppointmentId?: mongoose.Types.ObjectId,
): Promise<{ id: string; start: Date; end: Date } | null> {
  if (rangeEnd <= rangeStart) return null

  const filter: Record<string, unknown> = {
    garageId,
    status: { $nin: ['cancelled'] as const },
    start: { $lt: rangeEnd },
    end: { $gt: rangeStart },
  }
  if (excludeAppointmentId) {
    filter._id = { $ne: excludeAppointmentId }
  }

  const doc = await Appointment.findOne(filter).select('start end').lean()
  if (!doc) return null
  const id = String((doc as { _id: mongoose.Types.ObjectId })._id)
  const { start, end } = doc as { start: Date; end: Date }
  return { id, start, end }
}
