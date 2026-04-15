export type UserRole = 'superadmin' | 'manager' | 'mechanic' | 'cashier' | 'client'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  garageId: string | null
  clientId?: string | null
  avatar?: string
}

export interface Garage {
  id: string
  name: string
  address: string
  logo?: string
  subscriptionTier: 'starter' | 'pro' | 'enterprise'
  createdAt: string
  status: 'active' | 'suspended'
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address: string
  loyaltyPoints: number
  vehicleIds: string[]
  createdAt: string
  lastVisit?: string
  totalSpent: number
}

export interface Vehicle {
  id: string
  clientId: string
  plate: string
  vin: string
  make: string
  model: string
  year: number
  engine?: string
  mileage: number
  color?: string
  lastService?: string
}

export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Repair {
  id: string
  vehicleId: string
  clientId: string
  mechanicId: string
  serviceIds: string[]
  status: RepairStatus
  startDate: string
  endDate?: string
  notes?: string
  type: string
}

export interface QuoteLine {
  id: string
  label: string
  kind: 'service' | 'part'
  qty: number
  unitPrice: number
  tva: number
  discountPct?: number
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'invoiced' | 'paid'

export interface Quote {
  id: string
  clientId: string
  vehicleId: string
  lines: QuoteLine[]
  totalHt: number
  totalTtc: number
  tva: number
  discount: number
  status: QuoteStatus
  validUntil: string
}

export interface Invoice {
  id: string
  quoteId: string
  clientId: string
  vehicleId: string
  totalTtc: number
  paidAt?: string
  paymentMethod?: 'card' | 'transfer' | 'cash'
  status: 'unpaid' | 'paid' | 'overdue'
}

export interface Service {
  id: string
  name: string
  category: string
  durationMin: number
  price: number
  description?: string
}

export interface Part {
  id: string
  reference: string
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  supplier: string
  visibility: 'public' | 'private'
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'doing' | 'done'

export interface Task {
  id: string
  title: string
  assigneeId: string
  vehicleId?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Appointment {
  id: string
  clientId: string
  vehicleId: string
  serviceId: string
  mechanicId: string
  start: string
  end: string
  notes?: string
  status: AppointmentStatus
  type: 'repair' | 'revision' | 'wash'
}

export type CouponType = 'percent' | 'fixed'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minSpend: number
  maxUses: number
  usedCount: number
  expiresAt: string
  isActive: boolean
}

export interface RevenuePoint {
  month: string
  value: number
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
}
