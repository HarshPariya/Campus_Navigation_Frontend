'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { resourcesAPI } from '@/lib/api'
import { Package, MapPin, Search, Filter, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ResourceItem {
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
}

const resourceTypeLabels: Record<string, string> = {
  'library-seat': 'Library Seat',
  computer: 'Computer',
  'lab-equipment': 'Lab Equipment',
  'study-room': 'Study Room',
  other: 'Other',
}

const statusStyles: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-red-100 text-red-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  reserved: 'bg-blue-100 text-blue-700',
}

export default function ResourcesPage() {
  const { user, loading, socket } = useAuth()
  const router = useRouter()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loadingResources, setLoadingResources] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchResources = useCallback(async () => {
    setLoadingResources(true)
    try {
      const params: Record<string, string> = {}
      if (typeFilter !== 'all') params.type = typeFilter
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await resourcesAPI.getAll(params)
      setResources(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoadingResources(false)
    }
  }, [typeFilter, statusFilter])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchResources()
    }
  }, [user, fetchResources])

  useEffect(() => {
    if (!socket) return
    const events = [
      'resource-created',
      'resource-updated',
      'resource-deleted',
      'resource-status-updated',
      'resource-reserved',
    ] as const
    events.forEach((event) => socket.on(event, fetchResources))
    return () => {
      events.forEach((event) => socket.off(event, fetchResources))
    }
  }, [socket, fetchResources])

  const filteredResources = useMemo(() => {
    if (!searchTerm) return resources
    const lower = searchTerm.toLowerCase()
    return resources.filter((resource) =>
      `${resource.name} ${resource.location.building} ${resource.location.roomId}`
        .toLowerCase()
        .includes(lower)
    )
  }, [resources, searchTerm])

  const availableCount = resources.filter((resource) => resource.status === 'available').length

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
          <h1 className="text-3xl font-bold text-gray-900">Campus Resources</h1>
          <p className="text-gray-600 mt-2">
            Track availability of library seats, systems, lab equipment, and other shared resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Total resources</p>
            <p className="text-2xl font-bold mt-2">{resources.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Currently available</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{availableCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Under maintenance</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">
              {resources.filter((resource) => resource.status === 'maintenance').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Resource type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All types</option>
                {Object.keys(resourceTypeLabels).map((key) => (
                  <option key={key} value={key}>
                    {resourceTypeLabels[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Any status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or location"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <button
            onClick={fetchResources}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Refresh list
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {loadingResources ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No resources match your filters.</p>
          ) : (
            filteredResources.map((resource) => (
              <Link
                key={resource._id}
                href={`/resources/${resource._id}`}
                className="p-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between hover:bg-gray-50 transition"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{resource.name}</p>
                      <p className="text-sm text-gray-600">
                        {resourceTypeLabels[resource.type] || resource.type}
                      </p>
                    </div>
                    <span className={`badge ${statusStyles[resource.status] || 'bg-gray-100'}`}>
                      {resource.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {resource.location.building} • {resource.location.roomId}
                    </div>
                    {resource.metadata?.seatNumber && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Seat {resource.metadata.seatNumber}
                      </div>
                    )}
                    {resource.metadata?.computerId && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        System {resource.metadata.computerId}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}


