'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { eventsAPI } from '@/lib/api'
import { Calendar, Clock, MapPin, Users, ArrowLeft, FileEdit } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { sampleEvents } from '@/data/sampleEvents'

interface EventDetail {
  _id: string
  title: string
  description?: string
  venue: {
    building: string
    roomId: string
    floor?: number
  }
  date: string
  startTime: string
  endTime: string
  organizer: string
  category: string
  status: string
  attendees: { _id: string; name: string; email: string }[]
  registrations?: {
    userId: { _id: string; name: string; email: string }
    phone?: string
    department?: string
    notes?: string
  }[]
  maxAttendees?: number
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading, socket } = useAuth()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [fetching, setFetching] = useState(true)
  const eventId = params?.id as string

  const fetchEvent = useCallback(async () => {
    if (!eventId) return
    const sampleMatch = sampleEvents.find((sample) => sample._id === eventId)
    if (sampleMatch) {
      setEvent(sampleMatch as unknown as EventDetail)
      setFetching(false)
      return
    }

    setFetching(true)
    try {
      const response = await eventsAPI.getById(eventId)
      setEvent(response.data.data)
    } catch (error) {
      console.error('Failed to fetch event', error)
      toast.error('Unable to load event')
      router.push('/events')
    } finally {
      setFetching(false)
    }
  }, [eventId, router])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchEvent()
    }
  }, [user, fetchEvent])

  useEffect(() => {
    if (!socket) return
    const eventsToWatch = ['event-updated', 'event-registration-updated'] as const
    eventsToWatch.forEach((eventName) => socket.on(eventName, fetchEvent))
    return () => {
      eventsToWatch.forEach((eventName) => socket.off(eventName, fetchEvent))
    }
  }, [socket, fetchEvent])

  if (loading || !user || fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  if (!event) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to events
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase text-primary-600 font-semibold">Campus Event</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
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
            </div>
            {user.role === 'student' && (
              <Link
                href={
                  event.attendees.some((attendee) => attendee._id === user.id)
                    ? `/events/${event._id}`
                    : `/events/${event._id}/register`
                }
                className="btn-primary px-5 py-2 text-sm inline-flex gap-2 items-center justify-center"
              >
                <FileEdit className="w-4 h-4" />
                {event.attendees.some((attendee) => attendee._id === user.id)
                  ? 'View registration'
                  : 'Fill registration form'}
              </Link>
            )}
          </div>

          {event.description && <p className="text-gray-700 leading-relaxed">{event.description}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-primary-600" />
                {format(new Date(event.date), 'EEEE, MMM dd yyyy')}
              </div>
            </div>
            <div className="border border-gray-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Time</p>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-primary-600" />
                {event.startTime} - {event.endTime}
              </div>
            </div>
            <div className="border border-gray-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Venue</p>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-primary-600" />
                {event.venue.building} • {event.venue.roomId}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-3">
                <Users className="w-4 h-4 text-primary-600" />
                Attendees {event.maxAttendees && `(max ${event.maxAttendees})`}
              </div>
              {event.attendees.length === 0 ? (
                <p className="text-sm text-gray-500">No registrations yet.</p>
              ) : (
                <div className="space-y-3">
                  {event.attendees.map((attendee) => (
                    <div
                      key={attendee._id}
                      className="border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700"
                    >
                      <p className="font-medium text-gray-900">{attendee.name}</p>
                      <p className="text-xs text-gray-500">{attendee.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-3">
                <FileEdit className="w-4 h-4 text-primary-600" />
                Registration details
              </div>
              {!event.registrations || event.registrations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Attendees haven&rsquo;t filled the registration form yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {event.registrations.map((registration, index) => (
                    <div
                      key={`${registration.userId._id}-${index}`}
                      className="border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 space-y-1"
                    >
                      <p className="font-medium text-gray-900">
                        {registration.userId.name}{' '}
                        <span className="text-xs text-gray-500">{registration.userId.email}</span>
                      </p>
                      {registration.department && (
                        <p className="text-xs text-gray-600">Department: {registration.department}</p>
                      )}
                      {registration.phone && (
                        <p className="text-xs text-gray-600">Phone: {registration.phone}</p>
                      )}
                      {registration.notes && (
                        <p className="text-xs text-gray-600">Notes: {registration.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}


