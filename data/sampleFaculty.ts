import type { FacultyProfile } from '@/types/faculty'

export const sampleFaculty: FacultyProfile[] = [
  {
    _id: 'sample-1',
    name: 'Dr. Ananya Rao',
    department: 'Computer Science',
    designation: 'Associate Professor',
    cabin: { roomId: 'CAB-301', building: 'Academic Block A', floor: 3 },
    availability: {
      isAvailable: true,
      currentStatus: 'Available in cabin',
      schedule: [
        { day: 'Monday', timeSlots: [{ startTime: '10:00 AM', endTime: '1:00 PM' }] },
        { day: 'Wednesday', timeSlots: [{ startTime: '2:00 PM', endTime: '5:00 PM' }] },
      ],
    },
    contact: {
      email: 'ananya.rao@campus.edu',
      phone: '+91 98765 43210',
      extension: '2211',
    },
  },
  {
    _id: 'sample-2',
    name: 'Prof. Karthik Menon',
    department: 'Electronics',
    designation: 'HOD, ECE',
    cabin: { roomId: 'CAB-215', building: 'Innovation Tower', floor: 2 },
    availability: {
      isAvailable: false,
      currentStatus: 'In class',
      schedule: [
        { day: 'Tuesday', timeSlots: [{ startTime: '11:00 AM', endTime: '1:00 PM' }] },
        { day: 'Thursday', timeSlots: [{ startTime: '3:00 PM', endTime: '6:00 PM' }] },
      ],
    },
    contact: {
      email: 'karthik.menon@campus.edu',
      phone: '+91 98500 12345',
      extension: '2105',
    },
  },
  {
    _id: 'sample-3',
    name: 'Dr. Saira Khan',
    department: 'Mechanical',
    designation: 'Assistant Professor',
    cabin: { roomId: 'CAB-118', building: 'Main Admin Block', floor: 1 },
    availability: {
      isAvailable: true,
      currentStatus: 'Available for consultation',
      schedule: [
        { day: 'Monday', timeSlots: [{ startTime: '9:00 AM', endTime: '11:00 AM' }] },
        { day: 'Friday', timeSlots: [{ startTime: '1:00 PM', endTime: '4:00 PM' }] },
      ],
    },
    contact: {
      email: 'saira.khan@campus.edu',
      phone: '+91 98111 22334',
      extension: '2330',
    },
  },
]


