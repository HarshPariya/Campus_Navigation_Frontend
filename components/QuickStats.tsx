'use client'

import { useEffect, useState } from 'react'
import { Building2, Calendar, Users, MapPin } from 'lucide-react'
import { roomsAPI, eventsAPI, resourcesAPI } from '@/lib/api'

export default function QuickStats() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    upcomingEvents: 0,
    availableResources: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [roomsRes, eventsRes, resourcesRes] = await Promise.all([
        roomsAPI.getAll(),
        eventsAPI.getAll({ upcoming: 'true' }),
        resourcesAPI.getAll({ status: 'available' }),
      ])

      const rooms = roomsRes.data.data || []
      const availableRooms = rooms.filter((r: any) => r.isAvailable).length

      setStats({
        totalRooms: rooms.length,
        availableRooms,
        upcomingEvents: eventsRes.data.count || 0,
        availableResources: resourcesRes.data.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms,
      icon: MapPin,
      color: 'bg-green-500',
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'Available Resources',
      value: stats.availableResources,
      icon: Users,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-6 card-hover"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

