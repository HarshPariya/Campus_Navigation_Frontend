'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { roomsAPI } from '@/lib/api'
import { Building2, MapPin, Users, Clock, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import RoomBooking from '@/components/RoomBooking'

interface Room {
  _id: string
  roomId: string
  name: string
  building: string
  floor: number
  type: string
  capacity: number
  currentOccupancy: number
  isAvailable: boolean
  coordinates: { x: number; y: number }
  schedule: any[]
  facilities: string[]
  description: string
}

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, socket } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoom()

    if (socket) {
      socket.on('room-updated', () => fetchRoom())
      socket.on('room-availability-updated', () => fetchRoom())
      return () => {
        socket.off('room-updated')
        socket.off('room-availability-updated')
      }
    }
  }, [params.id, socket])

  const fetchRoom = async () => {
    try {
      const response = await roomsAPI.getById(params.id as string)
      setRoom(response.data.data)
    } catch (error) {
      console.error('Error fetching room:', error)
      toast.error('Room not found')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAvailabilityUpdate = async () => {
    if (!room) return
    try {
      await roomsAPI.updateAvailability(room.roomId, {
        isAvailable: !room.isAvailable,
        currentOccupancy: room.currentOccupancy,
      })
      toast.success('Room availability updated')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!room) {
    return null
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todaySchedule = room.schedule?.find((s) => s.day === today) || null

  return (
    <Layout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
              <p className="text-gray-600 mt-1">{room.roomId}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`badge ${
                  room.isAvailable
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {room.isAvailable ? 'Available' : 'Occupied'}
              </span>
              {room.isAvailable && user && (
                <RoomBooking roomId={room.roomId} onBookingSuccess={fetchRoom} />
              )}
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <button
                  onClick={handleAvailabilityUpdate}
                  className="btn-secondary text-sm"
                >
                  Toggle Availability
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Building</p>
                <p className="font-medium">{room.building}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Floor</p>
                <p className="font-medium">Floor {room.floor}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="font-medium">
                  {room.currentOccupancy} / {room.capacity}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium capitalize">{room.type}</p>
            </div>
          </div>

          {room.description && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="text-gray-900">{room.description}</p>
            </div>
          )}

          {room.facilities && room.facilities.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Facilities</p>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((facility, index) => (
                  <span key={index} className="badge bg-gray-100 text-gray-700">
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          {todaySchedule && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Today's Schedule ({today})
              </h3>
              <div className="space-y-3">
                {todaySchedule.timeSlots.map((slot: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.subject && <span>{slot.subject}</span>}
                      {slot.faculty && <span className="ml-2">• {slot.faculty}</span>}
                      {slot.batch && <span className="ml-2">• {slot.batch}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {room.schedule && room.schedule.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
              <div className="space-y-4">
                {room.schedule.map((daySchedule, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{daySchedule.day}</h4>
                    <div className="space-y-2">
                      {daySchedule.timeSlots.map((slot: any, slotIndex: number) => (
                        <div
                          key={slotIndex}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <div className="text-gray-900">
                            {slot.subject && <span>{slot.subject}</span>}
                            {slot.faculty && <span className="ml-2 text-gray-600">• {slot.faculty}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

