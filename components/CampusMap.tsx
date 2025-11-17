'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { roomsAPI } from '@/lib/api'

// Dynamically import map component with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
})

export default function CampusMap() {
  return <MapComponent />
}
