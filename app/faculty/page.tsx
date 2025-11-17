'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { facultyAPI } from '@/lib/api'
import { Building2, MapPin, Phone, Filter, Search, User } from 'lucide-react'
import Link from 'next/link'
import type { FacultyProfile } from '@/types/faculty'
import { sampleFaculty } from '@/data/sampleFaculty'

export default function FacultyDirectoryPage() {
  const { user, loading, socket } = useAuth()
  const router = useRouter()
  const [faculty, setFaculty] = useState<FacultyProfile[]>([])
  const [loadingFaculty, setLoadingFaculty] = useState(true)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showingSample, setShowingSample] = useState(false)

  const fetchFaculty = useCallback(async () => {
    setLoadingFaculty(true)
    try {
      const response = await facultyAPI.getAll()
      const data = response.data.data || []
      if (data.length === 0) {
        setFaculty(sampleFaculty)
        setShowingSample(true)
      } else {
        setFaculty(data)
        setShowingSample(false)
      }
    } catch (error) {
      console.error('Failed to fetch faculty:', error)
      setFaculty(sampleFaculty)
      setShowingSample(true)
    } finally {
      setLoadingFaculty(false)
    }
  }, [])

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

  const departments = useMemo(() => {
    const unique = new Set(faculty.map((member) => member.department))
    return Array.from(unique).sort()
  }, [faculty])

  const filteredFaculty = useMemo(() => {
    return faculty.filter((member) => {
      if (departmentFilter !== 'all' && member.department !== departmentFilter) return false
      if (availabilityFilter !== 'all') {
        const isAvailable = member.availability?.isAvailable
        if (availabilityFilter === 'available' && !isAvailable) return false
        if (availabilityFilter === 'busy' && isAvailable) return false
      }
      if (searchTerm) {
        const haystack = `${member.name} ${member.department} ${member.cabin.roomId}`.toLowerCase()
        if (!haystack.includes(searchTerm.toLowerCase())) return false
      }
      return true
    })
  }, [faculty, departmentFilter, availabilityFilter, searchTerm])

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
          <h1 className="text-3xl font-bold text-gray-900">Faculty Cabins</h1>
          <p className="text-gray-600 mt-2">
            Locate faculty cabins instantly, check their availability status, and plan your visit.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, department, or room ID"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Any status</option>
                <option value="available">Available now</option>
                <option value="busy">Currently busy</option>
              </select>
            </div>
            <button
              onClick={fetchFaculty}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Refresh
            </button>
          </div>
          {showingSample && (
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-4 py-3">
              Showing sample faculty cabins until real profiles are added to the system. Once actual data exists in MongoDB, it will appear here automatically.
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {loadingFaculty ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredFaculty.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No faculty match the current filters.</p>
          ) : (
            filteredFaculty.map((member) => (
              <Link
                key={member._id}
                href={`/faculty/${member._id}`}
                className="p-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between hover:bg-gray-50 transition"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">
                        {member.designation ? `${member.designation} · ` : ''}
                        {member.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {member.cabin.building}, Floor {member.cabin.floor}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {member.cabin.roomId}
                    </div>
                    {member.availability?.currentStatus && (
                      <span
                        className={`badge ${
                          member.availability.isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {member.availability.currentStatus}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  {member.contact?.email && <p>{member.contact.email}</p>}
                  {member.contact?.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {member.contact.phone}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}


