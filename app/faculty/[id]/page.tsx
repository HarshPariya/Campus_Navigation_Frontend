'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { facultyAPI } from '@/lib/api'
import { Building2, MapPin, Phone, Mail, Clock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { FacultyProfile } from '@/types/faculty'
import { sampleFaculty } from '@/data/sampleFaculty'

export default function FacultyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading, socket } = useAuth()
  const [faculty, setFaculty] = useState<FacultyProfile | null>(null)
  const [fetching, setFetching] = useState(true)

  const facultyId = params?.id as string

  const fetchFaculty = useCallback(async () => {
    if (!facultyId) return
    const sampleMatch = sampleFaculty.find((profile) => profile._id === facultyId)
    if (sampleMatch) {
      setFaculty(sampleMatch)
      setFetching(false)
      return
    }

    setFetching(true)
    try {
      const response = await facultyAPI.getById(facultyId)
      setFaculty(response.data.data)
    } catch (error) {
      console.error('Failed to fetch faculty profile:', error)
      toast.error('Unable to load faculty details')
      router.push('/faculty')
    } finally {
      setFetching(false)
    }
  }, [facultyId, router])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchFaculty()
    }
  }, [user, fetchFaculty])

  useEffect(() => {
    if (!socket) return
    const events = ['faculty-updated', 'faculty-availability-updated'] as const
    events.forEach((event) => socket.on(event, fetchFaculty))
    return () => {
      events.forEach((event) => socket.off(event, fetchFaculty))
    }
  }, [socket, fetchFaculty])

  if (loading || !user || fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  if (!faculty) {
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
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <p className="text-sm uppercase text-primary-600 font-semibold">Faculty Cabin</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{faculty.name}</h1>
            <p className="text-gray-600 mt-1">
              {[faculty.designation, faculty.department].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2">Cabin Location</h3>
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4" />
                {faculty.cabin.building}, Floor {faculty.cabin.floor}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                {faculty.cabin.roomId}
              </div>
            </div>
            <div className="border border-gray-100 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2">Availability</h3>
              {faculty.availability ? (
                <>
                  <p
                    className={`badge ${
                      faculty.availability.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {faculty.availability.currentStatus || 'Status unavailable'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {faculty.availability.isAvailable
                      ? 'Available to meet'
                      : 'Currently unavailable'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Availability details not provided.</p>
              )}
            </div>
          </div>

          {faculty.contact && (
            <div className="border border-gray-100 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">Contact</h3>
              {faculty.contact.email && (
                <p className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  {faculty.contact.email}
                </p>
              )}
              {faculty.contact.phone && (
                <p className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4" />
                  {faculty.contact.phone}
                </p>
              )}
              {faculty.contact.extension && (
                <p className="text-sm text-gray-600">Ext: {faculty.contact.extension}</p>
              )}
            </div>
          )}

          {faculty.availability?.schedule && faculty.availability.schedule.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Weekly Cabin Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faculty.availability.schedule.map((daySchedule, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-gray-900">{daySchedule.day}</p>
                    {daySchedule.timeSlots && daySchedule.timeSlots.length > 0 ? (
                      daySchedule.timeSlots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          {slot.startTime} - {slot.endTime}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No schedule provided.</p>
                    )}
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


