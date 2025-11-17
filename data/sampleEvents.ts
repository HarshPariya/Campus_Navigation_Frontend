export interface SampleEvent {
  _id: string
  title: string
  description?: string
  venue: {
    building: string
    roomId: string
    floor?: number
  }
  date: string
  startTime: string
  endTime: string
  organizer: string
  category: string
  status: 'upcoming' | 'ongoing' | 'completed'
  attendees: { _id: string; name: string; email: string }[]
  registrations: {
    userId: { _id: string; name: string; email: string }
    phone?: string
    department?: string
    notes?: string
  }[]
  maxAttendees?: number
}

export const sampleEvents: SampleEvent[] = [
  {
    _id: 'sample-event-ongoing',
    title: 'AI Innovation Sprint',
    description:
      'Hands-on build sprint where cross-functional teams prototype AI-powered campus tools.',
    venue: {
      building: 'Innovation Lab',
      roomId: 'LAB-204',
      floor: 2,
    },
    date: new Date().toISOString(),
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    organizer: 'Center for Emerging Technologies',
    category: 'workshop',
    status: 'ongoing',
    attendees: [
      { _id: 'sample-user-1', name: 'Priya Sharma', email: 'priya@students.campus.edu' },
      { _id: 'sample-user-2', name: 'Rahul Nair', email: 'rahul@students.campus.edu' },
    ],
    registrations: [
      {
        userId: { _id: 'sample-user-1', name: 'Priya Sharma', email: 'priya@students.campus.edu' },
        phone: '+91 98765 11111',
        department: 'Computer Science',
        notes: 'Working on campus assistant bot demo.',
      },
      {
        userId: { _id: 'sample-user-2', name: 'Rahul Nair', email: 'rahul@students.campus.edu' },
        phone: '+91 91234 56789',
        department: 'Electronics',
        notes: 'Building hardware interface for the sprint.',
      },
    ],
    maxAttendees: 30,
  },
  {
    _id: 'sample-event-upcoming',
    title: 'Green Campus Community Meetup',
    description: 'Monthly meetup to share sustainability ideas and campus improvements.',
    venue: {
      building: 'Community Hall',
      roomId: 'HALL-1',
      floor: 1,
    },
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '04:00 PM',
    endTime: '06:00 PM',
    organizer: 'Student Affairs Council',
    category: 'meeting',
    status: 'upcoming',
    attendees: [],
    registrations: [],
  },
]


