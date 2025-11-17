'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { resourcesAPI } from '@/lib/api'
import { MapPin, Package, Calendar, Clock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface ResourceDetail {
  _id: string
  name: string
  type: string
  status: string
  location: {
    building: string
    roomId: string
    floor?: number
  }
  metadata?: {
    seatNumber?: string
    computerId?: string
    equipmentName?: string
  }
  reservation?: {
    userId?: { _id: string; name: string; email: string }
    startTime?: string
    endTime?: string
  }
  currentUser?: { _id: string; name: string }
}

const statusOptions = ['available', 'occupied', 'reserved', 'maintenance']

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading, socket } = useAuth()
  const [resource, setResource] = useState<ResourceDetail | null>(null)
  const [fetching, setFetching] = useState(true)
  const [reserveForm, setReserveForm] = useState({ startTime: '', endTime: '' })
  const [statusForm, setStatusForm] = useState({ status: 'available', currentUser: '' })

  const resourceId = params?.id as string

  const fetchResource = useCallback(async () => {
    if (!resourceId) return
    setFetching(true)
    try {
      const response = await resourcesAPI.getById(resourceId)
      const data = response.data.data
      setResource(data)
      setStatusForm({
        status: data.status,
        currentUser: data.currentUser?._id ?? '',
      })
    } catch (error) {
      console.error('Failed to fetch resource', error)
      toast.error('Unable to load resource details')
      router.push('/resources')
    } finally {
      setFetching(false)
    }
  }, [resourceId, router])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchResource()
    }
  }, [user, fetchResource])

  useEffect(() => {
    if (!socket) return
    const events = [
      'resource-updated',
      'resource-status-updated',
      'resource-reserved',
      'resource-deleted',
    ] as const
    events.forEach((event) => socket.on(event, fetchResource))
    return () => {
      events.forEach((event) => socket.off(event, fetchResource))
    }
  }, [socket, fetchResource])

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resource) return
    if (!reserveForm.startTime || !reserveForm.endTime) {
      toast.error('Select both start and end time')
      return
    }
    try {
      await resourcesAPI.reserve(resource._id, {
        startTime: new Date(reserveForm.startTime).toISOString(),
        endTime: new Date(reserveForm.endTime).toISOString(),
      })
      toast.success('Reservation submitted')
      setReserveForm({ startTime: '', endTime: '' })
      fetchResource()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to reserve resource')
    }
  }

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resource) return
    try {
      await resourcesAPI.updateStatus(resource._id, {
        status: statusForm.status,
        currentUser: statusForm.currentUser || undefined,
      })
      toast.success('Resource status updated')
      fetchResource()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update status')
    }
  }

  if (loading || !user || fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  if (!resource) {
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
          Back to resources
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase text-primary-600 font-semibold">Resource</p>
            <h1 className="text-3xl font-bold text-gray-900">{resource.name}</h1>
            <p className="text-gray-600 capitalize">{resource.type.replace('-', ' ')}</p>
            <span className={`badge ${resource.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {resource.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-primary-600" />
                {resource.location.building} • {resource.location.roomId}
              </div>
              {resource.location.floor !== undefined && (
                <p className="text-sm text-gray-600">Floor {resource.location.floor}</p>
              )}
            </div>
            {resource.metadata && (
              <div className="border border-gray-100 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Metadata</p>
                {resource.metadata.seatNumber && (
                  <p className="text-sm text-gray-700">Seat {resource.metadata.seatNumber}</p>
                )}
                {resource.metadata.computerId && (
                  <p className="text-sm text-gray-700">System {resource.metadata.computerId}</p>
                )}
                {resource.metadata.equipmentName && (
                  <p className="text-sm text-gray-700">{resource.metadata.equipmentName}</p>
                )}
              </div>
            )}
          </div>

          {resource.reservation?.userId && (
            <div className="border border-gray-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Active reservation</p>
              <p className="text-sm text-gray-700">
                {resource.reservation.userId.name} ({resource.reservation.userId.email})
              </p>
              {resource.reservation.startTime && resource.reservation.endTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  {new Date(resource.reservation.startTime).toLocaleString()} -{' '}
                  {new Date(resource.reservation.endTime).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleReserve} className="border border-gray-100 rounded-lg p-4 space-y-4">
              <p className="font-semibold text-gray-900">Reserve this resource</p>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Start</label>
                <input
                  type="datetime-local"
                  value={reserveForm.startTime}
                  onChange={(e) => setReserveForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">End</label>
                <input
                  type="datetime-local"
                  value={reserveForm.endTime}
                  onChange={(e) => setReserveForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button className="btn-primary text-sm px-4 py-2" type="submit">
                Reserve
              </button>
            </form>

            {(user.role === 'admin' || user.role === 'faculty') && (
              <form
                onSubmit={handleStatusUpdate}
                className="border border-gray-100 rounded-lg p-4 space-y-4"
              >
                <p className="font-semibold text-gray-900">Update status</p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) =>
                      setStatusForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Current user ID (optional)
                  </label>
                  <input
                    type="text"
                    value={statusForm.currentUser}
                    onChange={(e) =>
                      setStatusForm((prev) => ({ ...prev, currentUser: e.target.value }))
                    }
                    placeholder="MongoDB user id"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button className="btn-secondary text-sm px-4 py-2" type="submit">
                  Save status
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}


