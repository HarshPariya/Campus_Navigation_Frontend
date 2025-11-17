'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Building2, User, Calendar, Package } from 'lucide-react'
import { roomsAPI, eventsAPI, facultyAPI, resourcesAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface SearchResult {
  type: 'room' | 'event' | 'faculty' | 'resource'
  id: string
  name: string
  description?: string
  location?: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (query.length > 2) {
      performSearch()
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [query])

  const performSearch = async () => {
    try {
      const [roomsRes, eventsRes, facultyRes, resourcesRes] = await Promise.all([
        roomsAPI.getAll({ search: query }),
        eventsAPI.getAll({ search: query }),
        facultyAPI.getAll({ search: query }),
        resourcesAPI.getAll({ search: query }),
      ])

      const searchResults: SearchResult[] = []

      roomsRes.data.data?.forEach((room: any) => {
        searchResults.push({
          type: 'room',
          id: room.roomId,
          name: room.name,
          description: `${room.building}, Floor ${room.floor}`,
          location: `${room.building} - ${room.name}`,
        })
      })

      eventsRes.data.data?.forEach((event: any) => {
        searchResults.push({
          type: 'event',
          id: event._id,
          name: event.title,
          description: event.description,
          location: `${event.venue.building} - ${event.venue.roomId}`,
        })
      })

      facultyRes.data.data?.forEach((faculty: any) => {
        searchResults.push({
          type: 'faculty',
          id: faculty._id,
          name: faculty.name,
          description: faculty.department,
          location: `${faculty.cabin.building} - ${faculty.cabin.roomId}`,
        })
      })

      resourcesRes.data.data?.forEach((resource: any) => {
        searchResults.push({
          type: 'resource',
          id: resource._id,
          name: resource.name,
          description: resource.type.replace('-', ' '),
          location: `${resource.location.building} - ${resource.location.roomId}`,
        })
      })

      setResults(searchResults.slice(0, 10))
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setQuery('')
    setShowResults(false)
    
    if (result.type === 'room') {
      router.push(`/rooms/${result.id}`)
    } else if (result.type === 'event') {
      router.push(`/events/${result.id}`)
    } else if (result.type === 'faculty') {
      router.push(`/faculty/${result.id}`)
    } else if (result.type === 'resource') {
      router.push(`/resources/${result.id}`)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'room':
        return <Building2 className="w-4 h-4" />
      case 'event':
        return <Calendar className="w-4 h-4" />
      case 'faculty':
        return <User className="w-4 h-4" />
      case 'resource':
        return <Package className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setShowResults(true)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          placeholder="Search for rooms, events, faculty..."
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary-600">{getIcon(result.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{result.name}</p>
                  {result.description && (
                    <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                  )}
                  {result.location && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {result.location}
                    </p>
                  )}
                </div>
                <span className="badge bg-primary-100 text-primary-700 capitalize">
                  {result.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

