import 'dotenv/config'
import mongoose from 'mongoose'
import { getEnv } from '@/config/env'
import { logger } from '@/config/logger'
import { User } from '@/models/User.model'
import { seedSuperadmin } from './superadmin.seed'
import { seedGarages } from './garages.seed'
import { seedClients } from './clients.seed'
import { seedUsers } from './users.seed'
import { seedVehicles } from './vehicles.seed'
import { seedServices } from './services.seed'
import { seedParts } from './parts.seed'
import { seedRepairs } from './repairs.seed'
import { seedAppointments } from './appointments.seed'
import { seedQuotes } from './quotes.seed'
import { seedTasks } from './tasks.seed'
import { seedCoupons } from './coupons.seed'

const PROD_SEED_FLAG = '--production'

function printSeedCredentials(): void {
  // eslint-disable-next-line no-console
  console.log(`
╔══════════════════════════════════════════════╗
║         GARAGEFLOW — SEED CREDENTIALS        ║
╠══════════════════════════════════════════════╣
║ SUPER ADMIN                                  ║
║ Email: superadmin@garageflow.app             ║
║ Pass:  SuperAdmin@2024!                      ║
╠══════════════════════════════════════════════╣
║ MANAGER (Garage Lefebvre)                    ║
║ Email: manager@garageflow.app                ║
║ Pass:  Manager@2024!                         ║
╠══════════════════════════════════════════════╣
║ MECHANIC                                     ║
║ Email: mechanic1@garageflow.app              ║
║ Pass:  Mechanic@2024!                        ║
╠══════════════════════════════════════════════╣
║ CASHIER                                      ║
║ Email: cashier@garageflow.app                ║
║ Pass:  Cashier@2024!                         ║
╠══════════════════════════════════════════════╣
║ CLIENT PORTAL                                ║
║ Email: client@garageflow.app                 ║
║ Pass:  Client@2024!                          ║
╚══════════════════════════════════════════════╝
`)
}

async function main() {
  const env = getEnv()
  if (env.NODE_ENV === 'production' && !process.argv.includes(PROD_SEED_FLAG)) {
    logger.error(
      'Refus du seed : en production, relancez avec le flag --production (ex. npm run seed:prod).',
    )
    process.exit(1)
  }
  const drop = process.argv.includes('--drop')
  const uri = env.MONGODB_URI
  await mongoose.connect(uri)
  if (drop) {
    await mongoose.connection.dropDatabase()
    logger.info('Database dropped')
  }

  if (!drop && (await User.exists({ email: 'superadmin@garageflow.app' }))) {
    logger.info(
      'Seed ignoré : les comptes de démo existent déjà. Pour repartir de zéro : npm run seed:fresh',
    )
    printSeedCredentials()
    await mongoose.disconnect()
    process.exit(0)
  }

  await seedSuperadmin()
  await seedGarages()
  await seedClients()
  await seedUsers()
  await seedVehicles()
  await seedServices()
  await seedParts()
  await seedRepairs()
  await seedAppointments()
  await seedQuotes()
  await seedTasks()
  await seedCoupons()

  printSeedCredentials()
  logger.info('Seed completed')
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((e) => {
  logger.error(e)
  process.exit(1)
})
