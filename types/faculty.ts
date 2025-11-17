export interface FacultyProfile {
  _id: string
  name: string
  department: string
  designation?: string
  cabin: {
    roomId: string
    building: string
    floor: number
  }
  availability?: {
    isAvailable: boolean
    currentStatus?: string
    schedule?: {
      day: string
      timeSlots: { startTime: string; endTime: string }[]
    }[]
  }
  contact?: {
    email?: string
    phone?: string
    extension?: string
  }
}


