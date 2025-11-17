'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { eventsAPI } from '@/lib/api'
import { Calendar, Clock, MapPin, ArrowLeft, FileEdit, Info } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { sampleEvents } from '@/data/sampleEvents'

interface EventInfo {
  _id: string
  title: string
  date: string
  startTime: string
  endTime: string
  venue: {
    building: string
    roomId: string
  }
  attendees?: { _id: string }[]
}

export default function EventRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sampleMode, setSampleMode] = useState(false)
  const [form, setForm] = useState({
    phone: '',
    department: '',
    notes: '',
  })

  const eventId = params?.id as string

  const fetchEvent = useCallback(async () => {
    const sampleMatch = sampleEvents.find((sample) => sample._id === eventId)
    if (sampleMatch) {
      setEvent(sampleMatch)
      setSampleMode(true)
      return
    }
    try {
      const response = await eventsAPI.getById(eventId)
      setEvent(response.data.data)
      setSampleMode(false)
    } catch (error) {
      toast.error('Unable to load event registration form')
      router.push('/events')
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

  const alreadyRegistered = event?.attendees?.some((attendee) => attendee._id === user?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !user) return
    if (sampleMode) {
      toast('Sample events are read-only. Create a real event to accept registrations.')
      return
    }
    setSubmitting(true)
    try {
      await eventsAPI.register(event._id, form)
      toast.success('Registration submitted')
      router.push(`/events/${event._id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to register right now')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user || !event) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  useEffect(() => {
    if (event && alreadyRegistered) {
      router.replace(`/events/${event._id}`)
    }
  }, [event, alreadyRegistered, router])

  if (alreadyRegistered) {
    return null
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileEdit className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm uppercase text-primary-600 font-semibold">
                Event registration form
              </p>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              {format(new Date(event.date), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" />
              {event.startTime} - {event.endTime}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              {event.venue.building} • {event.venue.roomId}
            </div>
          </div>
        </div>

        {sampleMode && (
          <div className="flex items-start gap-3 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5" />
            <p>
              This is a sample event to demonstrate an ongoing schedule with completed registrations.
              To register for real events, add them via the admin panel or backend API.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={user.name}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                value={user.email}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Phone number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="Computer Science"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Tell us why you want to attend</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
              placeholder="Share your expectations, questions, or anything the organizer should know..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || sampleMode}
              className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
            >
              {sampleMode ? 'Registration disabled for sample events' : submitting ? 'Submitting...' : 'Submit registration'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}


