'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, Users, Clock } from 'lucide-react'
import { roomsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

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
}

export default function RoomAvailability({ limit }: { limit?: number }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const { socket } = useAuth()

  useEffect(() => {
    fetchRooms()

    if (socket) {
      socket.on('room-updated', fetchRooms)
      socket.on('room-availability-updated', fetchRooms)
      socket.on('room-deleted', fetchRooms)

      return () => {
        socket.off('room-updated')
        socket.off('room-availability-updated')
        socket.off('room-deleted')
      }
    }
  }, [socket])

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll()
      let roomsData = response.data.data || []

      if (filter === 'available') {
        roomsData = roomsData.filter((r: Room) => r.isAvailable)
      } else if (filter === 'occupied') {
        roomsData = roomsData.filter((r: Room) => !r.isAvailable)
      }

      setRooms(limit ? roomsData.slice(0, limit) : roomsData)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [filter])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-600" />
          Room Availability
        </h2>
        {limit && (
          <Link href="/dashboard?tab=rooms" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        )}
      </div>

      {!limit && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'available'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setFilter('occupied')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'occupied'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Occupied
          </button>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No rooms found</p>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <Link
              key={room._id}
              href={`/rooms/${room.roomId}`}
              className="block border border-gray-200 rounded-lg p-4 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{room.name}</h3>
                    <span className={`badge ${
                      room.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {room.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {room.building}, Floor {room.floor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {room.currentOccupancy} / {room.capacity}
                    </div>
                    <span className="badge bg-gray-100 text-gray-700 capitalize">
                      {room.type}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

