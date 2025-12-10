import { useState, useEffect } from 'react';

export type Appointment = {
  id: string;
  customerName: string;
  vehicle: string;
  serviceType: string;
  date: string;
  time: string;
  address: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  mechanicId?: string;
};

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    customerName: 'Alice Johnson',
    vehicle: '2018 Honda Civic',
    serviceType: 'Synthetic Oil Change',
    date: '2025-12-15',
    time: '09:00',
    address: '123 State St, Orem, UT',
    status: 'scheduled',
    mechanicId: 'mech1'
  },
  {
    id: '2',
    customerName: 'Bob Smith',
    vehicle: '2020 Ford F-150',
    serviceType: 'Standard Oil Change',
    date: '2025-12-15',
    time: '11:00',
    address: '456 Center St, Provo, UT',
    status: 'in-progress',
    mechanicId: 'mech1'
  },
  {
    id: '3',
    customerName: 'Carol White',
    vehicle: '2019 Toyota Rav4',
    serviceType: 'High Mileage Oil Change',
    date: '2025-12-16',
    time: '14:00',
    address: '789 Main St, Lehi, UT',
    status: 'scheduled',
    mechanicId: 'mech1'
  }
];

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    // Load from local storage or fallback to mock
    const stored = localStorage.getItem('oilboys_appointments');
    if (stored) {
      setAppointments(JSON.parse(stored));
    } else {
      setAppointments(MOCK_APPOINTMENTS);
      localStorage.setItem('oilboys_appointments', JSON.stringify(MOCK_APPOINTMENTS));
    }
  }, []);

  const addAppointment = (appt: Omit<Appointment, 'id' | 'status'>) => {
    const newAppt: Appointment = {
      ...appt,
      id: Math.random().toString(36).substr(2, 9),
      status: 'scheduled',
      mechanicId: 'mech1' // Auto-assign for demo
    };
    const updated = [...appointments, newAppt];
    setAppointments(updated);
    localStorage.setItem('oilboys_appointments', JSON.stringify(updated));
  };

  const updateStatus = (id: string, status: Appointment['status']) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status } : a);
    setAppointments(updated);
    localStorage.setItem('oilboys_appointments', JSON.stringify(updated));
  };

  return { appointments, addAppointment, updateStatus };
}
