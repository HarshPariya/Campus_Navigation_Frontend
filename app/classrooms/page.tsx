'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import RoomCategoryView from '@/components/RoomCategoryView'

export default function ClassroomsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <Layout>
      <RoomCategoryView
        type="classroom"
        title="Classrooms"
        description="Browse all academic classrooms across campus, check real-time availability, and drill into details before you head to the building."
      />
    </Layout>
  )
}


