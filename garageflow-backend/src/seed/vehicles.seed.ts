import { Vehicle } from '@/models/Vehicle.model'
import { Client } from '@/models/Client.model'
import { garage1Id } from './garages.seed'

const MAKES = [
  ['Peugeot', '308'],
  ['Renault', 'Clio'],
  ['Citroën', 'C3'],
  ['Volkswagen', 'Golf'],
  ['Toyota', 'Yaris'],
  ['BMW', '320d'],
  ['Mercedes', 'C200'],
  ['Ford', 'Focus'],
  ['Opel', 'Astra'],
  ['Dacia', 'Sandero'],
]

function plate(i: number): string {
  const a = String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 3) % 26))
  const b = String(i % 900 + 100)
  const c = String.fromCharCode(65 + ((i + 7) % 26)) + String.fromCharCode(65 + ((i + 11) % 26))
  return `${a}-${b}-${c}`
}

export async function seedVehicles(): Promise<void> {
  const clients = await Client.find({ garageId: garage1Id }).limit(15)
  for (let i = 0; i < 25; i += 1) {
    const cl = clients[i % clients.length]
    const [make, model] = MAKES[i % MAKES.length]
    const year = 2010 + (i % 15)
    const v = await Vehicle.create({
      garageId: garage1Id,
      clientId: cl._id,
      plate: plate(i + 1),
      vin: `1HGBH41JXMN${String(100000 + i).slice(-6)}`,
      make,
      model,
      year,
      mileage: 5000 + i * 9000,
      fuelType: i % 2 === 0 ? 'diesel' : 'essence',
    })
    await Client.updateOne({ _id: cl._id }, { $addToSet: { vehicleIds: v._id } })
  }
}
