'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Building2, MapPin, Users, RefreshCcw, Search as SearchIcon } from 'lucide-react'
import { roomsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

type AvailabilityFilter = 'all' | 'available' | 'occupied'

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
  facilities?: string[]
  description?: string
}

interface RoomCategoryViewProps {
  type: 'classroom' | 'lab' | 'office' | 'library' | 'seminar' | 'auditorium'
  title: string
  description: string
}

export default function RoomCategoryView({ type, title, description }: RoomCategoryViewProps) {
  const { socket } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const response = await roomsAPI.getAll({ type })
      setRooms(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    if (!socket) return
    const events = ['room-updated', 'room-availability-updated', 'room-deleted'] as const
    events.forEach((event) => socket.on(event, fetchRooms))
    return () => {
      events.forEach((event) => socket.off(event, fetchRooms))
    }
  }, [socket, fetchRooms])

  const buildings = useMemo(() => {
    const uniqueBuildings = new Set(rooms.map((room) => room.building))
    return Array.from(uniqueBuildings).sort()
  }, [rooms])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (availabilityFilter === 'available' && !room.isAvailable) return false
      if (availabilityFilter === 'occupied' && room.isAvailable) return false
      if (buildingFilter !== 'all' && room.building !== buildingFilter) return false
      if (searchTerm) {
        const haystack = `${room.name} ${room.roomId} ${room.building}`.toLowerCase()
        if (!haystack.includes(searchTerm.toLowerCase())) return false
      }
      return true
    })
  }, [rooms, availabilityFilter, buildingFilter, searchTerm])

  const availableCount = useMemo(() => rooms.filter((room) => room.isAvailable).length, [rooms])
  const totalCapacity = useMemo(() => rooms.reduce((sum, room) => sum + room.capacity, 0), [rooms])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total spaces', value: rooms.length },
          { label: 'Currently available', value: availableCount },
          { label: 'Combined capacity', value: totalCapacity },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, room ID, or building"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All buildings</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Any status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
            </select>
            <button
              onClick={fetchRooms}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No rooms match the current filters.</p>
          ) : (
            filteredRooms.map((room) => (
              <Link
                key={room._id}
                href={`/rooms/${room.roomId}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-primary-200 hover:shadow-sm transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                      <span
                        className={`badge ${
                          room.isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {room.isAvailable ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{room.roomId}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {room.building}, Floor {room.floor}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {room.currentOccupancy} / {room.capacity}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {room.type}
                      </div>
                    </div>
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-600">
                        {room.facilities.slice(0, 4).map((facility, index) => (
                          <span key={index} className="badge bg-gray-100 text-gray-700">
                            {facility}
                          </span>
                        ))}
                        {room.facilities.length > 4 && (
                          <span className="text-gray-500">
                            +{room.facilities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


