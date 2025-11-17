'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import SearchBar from '@/components/SearchBar'
import QuickStats from '@/components/QuickStats'
import UpcomingEvents from '@/components/UpcomingEvents'
import RoomAvailability from '@/components/RoomAvailability'
import { Calendar, Building2, Users } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'rooms'>('overview')

  // Handle URL query params for navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab === 'events' || tab === 'rooms') {
      setActiveTab(tab as 'events' | 'rooms')
    } else {
      setActiveTab('overview')
    }
  }, [])

  // Update URL when tab changes
  const handleTabChange = (tab: 'overview' | 'events' | 'rooms') => {
    setActiveTab(tab)
    if (tab === 'overview') {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard?tab=${tab}`)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'student' ? 'Find your classrooms and resources' : 
             user.role === 'faculty' ? 'Manage your schedule and cabin' : 
             'Manage campus resources and events'}
          </p>
        </div>

        <SearchBar />

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => handleTabChange('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </div>
            </button>
            <button
              onClick={() => handleTabChange('rooms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rooms'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Rooms
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <QuickStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UpcomingEvents limit={5} />
                <RoomAvailability limit={10} />
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <UpcomingEvents />
            </div>
          )}

          {activeTab === 'rooms' && (
            <div>
              <RoomAvailability />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

