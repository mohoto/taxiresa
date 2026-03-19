export type BookingType = 'IMMEDIATE' | 'SCHEDULED'
export type VehicleType = 'VOITURE' | 'VAN'
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface CreateBookingPayload {
  clientName: string
  clientPhone: string
  clientEmail?: string
  pickupAddress: string
  dropAddress: string
  type: BookingType
  scheduledAt?: string
  notes?: string
  estimatedPrice?: number
  vehicleType?: VehicleType
}

export interface BookingWithRelations {
  id: string
  clientName: string
  clientPhone: string
  clientEmail: string | null
  invoiceSentAt: string | null
  pickupAddress: string
  dropAddress: string
  type: BookingType
  scheduledAt: string | null
  status: BookingStatus
  notes: string | null
  distanceText: string | null
  durationText: string | null
  estimatedPrice: number | null
  vehicleType: VehicleType
  telegramMsgId: string | null
  createdAt: string
  operator: { name: string }
  acceptance: {
    driver: { name: string; phone: string }
    acceptedAt: string
    etaMinutes: number | null
    etaUpdatedAt: string | null
    notifiedAt: string | null
  } | null
}
