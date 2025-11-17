'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import RoomCategoryView from '@/components/RoomCategoryView'

export default function LabsPage() {
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
        type="lab"
        title="Labs"
        description="Find the right laboratory with up-to-date occupancy, capacity, and facility information before you set up your experiments."
      />
    </Layout>
  )
}


