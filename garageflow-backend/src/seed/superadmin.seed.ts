import { User } from '@/models/User.model'

export async function seedSuperadmin(): Promise<void> {
  await User.create({
    email: 'superadmin@garageflow.app',
    password: 'SuperAdmin@2024!',
    name: 'Super Administrateur',
    role: 'superadmin',
    garageId: null,
  })
}
