'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { roomsAPI } from '@/lib/api'
import L from 'leaflet'

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface Room {
  _id: string
  roomId: string
  name: string
  building: string
  floor: number
  type: string
  isAvailable: boolean
  coordinates: { x: number; y: number }
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (map) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])
  return null
}

export default function MapComponent() {
  // All hooks must be at the top, before any conditional returns
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [mapInitialized, setMapInitialized] = useState(false)
  
  const mapInstanceRef = useRef<L.Map | null>(null)
  const initializedRef = useRef(false)
  const mapKeyRef = useRef(`map-${Math.random().toString(36).substr(2, 9)}`)
  const containerElementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Only mount on client side
    if (typeof window !== 'undefined' && !initializedRef.current) {
      initializedRef.current = true
      setMounted(true)
      fetchRooms()
    }
    
    // Cleanup: remove any existing map instances
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          // Ignore errors during cleanup
        }
        mapInstanceRef.current = null
        setMapInitialized(false)
      }
      // Clear container reference
      if (containerElementRef.current) {
        const container = containerElementRef.current
        // Remove Leaflet's internal data
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id
        }
        // Remove any Leaflet containers
        const leafletContainer = container.querySelector('.leaflet-container')
        if (leafletContainer) {
          leafletContainer.remove()
        }
      }
    }
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll()
      const roomsData = response.data.data || []
      setRooms(roomsData)

      // Set map center to first room or default
      if (roomsData.length > 0) {
        const firstRoom = roomsData[0]
        setMapCenter([firstRoom.coordinates.x, firstRoom.coordinates.y])
      } else {
        setMapCenter([0, 0]) // Default center
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoomIcon = (room: Room) => {
    const color = room.isAvailable ? 'green' : 'red'
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  }

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">No rooms available to display on map</p>
      </div>
    )
  }

  // Only render map once - when mounted, not loading, and not already initialized
  const shouldRenderMap = mounted && 
    typeof window !== 'undefined' && 
    !mapInitialized &&
    !mapInstanceRef.current

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Interactive Campus Map</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Occupied</span>
          </div>
        </div>
      </div>

      <div 
        ref={containerElementRef}
        className="h-96 rounded-lg overflow-hidden border border-gray-200" 
        id={`campus-map-${mapKeyRef.current}`}
      >
        {shouldRenderMap && (
          <MapContainer
            key={mapKeyRef.current}
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            whenReady={(map) => {
              if (!mapInstanceRef.current) {
                mapInstanceRef.current = map.target
                setMapInitialized(true) // Mark as initialized to prevent re-rendering
              }
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} />
            {rooms.map((room) => (
              <Marker
                key={room._id}
                position={[room.coordinates.x, room.coordinates.y]}
                icon={getRoomIcon(room)}
                eventHandlers={{
                  click: () => setSelectedRoom(room),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-gray-900">{room.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {room.building}, Floor {room.floor}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{room.type}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                        room.isAvailable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {room.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {selectedRoom && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">{selectedRoom.name}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Building:</span>
              <span className="ml-2 font-medium">{selectedRoom.building}</span>
            </div>
            <div>
              <span className="text-gray-600">Floor:</span>
              <span className="ml-2 font-medium">{selectedRoom.floor}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium capitalize">{selectedRoom.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span
                className={`ml-2 font-medium ${
                  selectedRoom.isAvailable ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {selectedRoom.isAvailable ? 'Available' : 'Occupied'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
