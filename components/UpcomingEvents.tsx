'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Clock, User } from 'lucide-react'
import { eventsAPI } from '@/lib/api'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface Event {
  _id: string
  title: string
  description: string
  venue: {
    building: string
    roomId: string
  }
  date: string
  startTime: string
  endTime: string
  organizer: string
  category: string
  attendees: any[]
  maxAttendees?: number
}

export default function UpcomingEvents({ limit }: { limit?: number }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { user, socket } = useAuth()

  useEffect(() => {
    fetchEvents()

    if (socket) {
      socket.on('event-created', fetchEvents)
      socket.on('event-updated', fetchEvents)
      socket.on('event-deleted', fetchEvents)

      return () => {
        socket.off('event-created')
        socket.off('event-updated')
        socket.off('event-deleted')
      }
    }
  }, [socket])

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ upcoming: 'true' })
      const eventsData = response.data.data || []
      setEvents(limit ? eventsData.slice(0, limit) : eventsData)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    try {
      await eventsAPI.register(eventId)
      toast.success('Registered for event successfully!')
      fetchEvents()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register')
    }
  }

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
          <Calendar className="w-5 h-5 text-primary-600" />
          Upcoming Events
        </h2>
        {limit && (
          <Link href="/dashboard?tab=events" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No upcoming events</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event._id}
              className="border border-gray-200 rounded-lg p-4 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.venue.building} - {event.venue.roomId}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {event.organizer}
                    </div>
                  </div>
                  {event.maxAttendees && (
                    <p className="text-xs text-gray-500 mt-2">
                      {event.attendees?.length || 0} / {event.maxAttendees} attendees
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <span className={`badge ${
                    event.category === 'seminar' ? 'bg-blue-100 text-blue-700' :
                    event.category === 'workshop' ? 'bg-purple-100 text-purple-700' :
                    event.category === 'fest' ? 'bg-pink-100 text-pink-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {event.category}
                  </span>
                </div>
              </div>
              {user && user.role === 'student' && (
                <button
                  onClick={() => handleRegister(event._id)}
                  className="mt-3 text-sm btn-primary py-1.5 px-3"
                  disabled={event.attendees?.some((a: any) => a._id === user.id)}
                >
                  {event.attendees?.some((a: any) => a._id === user.id)
                    ? 'Registered'
                    : 'Register'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

