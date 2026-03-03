import { useState } from 'react';

const MOCK_PROJECTS = [
  {
    id: 1,
    name: 'HVAC Installation  Building A',
    jobNumber: 'C-26-0042',
    status: 'active',
    location: '1234 Main St, Baltimore MD',
  },
  {
    id: 2,
    name: 'Plumbing Renovation',
    jobNumber: 'C-26-0038',
    status: 'active',
    location: '567 Oak Ave, Towson MD',
  },
  {
    id: 3,
    name: 'Electrical Upgrade Phase 2',
    jobNumber: 'C-26-0035',
    status: 'on_hold',
    location: '890 Pine Rd, Columbia MD',
  },
];

export function useProjects() {
  const [projects] = useState(MOCK_PROJECTS);

  return { projects };
}
