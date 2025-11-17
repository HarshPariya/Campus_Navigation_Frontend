'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { eventsAPI } from '@/lib/api'
import { Calendar, MapPin, Clock, Filter, Search, Info } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { sampleEvents } from '@/data/sampleEvents'

interface EventItem {
  _id: string
  title: string
  description?: string
  venue: {
    building: string
    roomId: string
  }
  date: string
  startTime: string
  endTime: string
  organizer: string
  category: string
  status: string
  attendees?: { _id: string; name: string }[]
  maxAttendees?: number
}

export default function EventsPage() {
  const { user, loading, socket } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [showingSample, setShowingSample] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>(
    'upcoming'
  )
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter === 'upcoming') {
        params.upcoming = 'true'
      } else if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (categoryFilter !== 'all') {
        params.category = categoryFilter
      }
      if (dateFilter) {
        params.date = dateFilter
      }

      const response = await eventsAPI.getAll(params)
      const data = response.data.data || []
      if (data.length === 0) {
        setEvents(sampleEvents)
        setShowingSample(true)
      } else {
        setEvents(data)
        setShowingSample(false)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
      toast.error('Unable to load events')
      setEvents(sampleEvents)
      setShowingSample(true)
    } finally {
      setLoadingEvents(false)
    }
  }, [statusFilter, categoryFilter, dateFilter])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user, fetchEvents])

  useEffect(() => {
    if (!socket) return
    const eventsToWatch = [
      'event-created',
      'event-updated',
      'event-deleted',
      'event-registration-updated',
    ] as const
    eventsToWatch.forEach((event) => socket.on(event, fetchEvents))
    return () => {
      eventsToWatch.forEach((event) => socket.off(event, fetchEvents))
    }
  }, [socket, fetchEvents])

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events
    const lower = searchTerm.toLowerCase()
    return events.filter((event) =>
      `${event.title} ${event.description ?? ''} ${event.venue.building}`.toLowerCase().includes(lower)
    )
  }, [events, searchTerm])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campus Events</h1>
          <p className="text-gray-600 mt-2">
            Discover what is happening around campus and register for sessions with one click.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-500">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-500">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All categories</option>
                <option value="seminar">Seminar</option>
                <option value="workshop">Workshop</option>
                <option value="fest">Fest</option>
                <option value="exam">Exam</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-500">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-500">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or venue"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <button
            onClick={fetchEvents}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Refresh list
          </button>
          {showingSample && (
            <div className="flex items-start gap-3 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <Info className="w-4 h-4 mt-0.5" />
              <p>
                Showing sample events while the backend has no data yet. Add real events via the admin
                panel and they will replace this list automatically.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {loadingEvents ? (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              No events found for the selected filters.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                    <span
                      className={`badge ${
                        event.category === 'workshop'
                          ? 'bg-purple-100 text-purple-700'
                          : event.category === 'seminar'
                          ? 'bg-blue-100 text-blue-700'
                          : event.category === 'fest'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {event.category}
                    </span>
                    <span
                      className={`badge ${
                        event.status === 'ongoing'
                          ? 'bg-green-100 text-green-700'
                          : event.status === 'completed'
                          ? 'bg-gray-100 text-gray-700'
                          : event.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                      {event.venue.building} • {event.venue.roomId}
                    </div>
                  </div>
                  {event.maxAttendees && (
                    <p className="text-xs text-gray-500">
                      {event.attendees?.length || 0} / {event.maxAttendees} seats filled
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Link href={`/events/${event._id}`} className="text-sm text-primary-600">
                      View details
                    </Link>
                  </div>
                </div>
                {user.role === 'student' && (
                  <Link
                    href={
                      event.attendees?.some((attendee) => attendee._id === user.id)
                        ? `/events/${event._id}`
                        : `/events/${event._id}/register`
                    }
                    className="btn-primary text-sm px-4 py-2 text-center"
                  >
                    {event.attendees?.some((attendee) => attendee._id === user.id)
                      ? 'View registration'
                      : 'Fill registration form'}
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}


