import { useState } from 'react';

const MOCK_STATS = [
  { label: 'Active Projects', value: 3, color: '#3b82f6' },
  { label: 'Deliveries', value: 12, color: '#22c55e' },
  { label: 'Inventory Items', value: 47, color: '#f59e0b' },
  { label: 'Pending Requests', value: 5, color: '#ef4444' },
];

const MOCK_ACTIVITY = [
  { id: 1, title: 'Delivery received', time: '2 hours ago' },
  { id: 2, title: 'New request: Ceiling Diffusers', time: '4 hours ago' },
  { id: 3, title: 'Project HVAC-26 updated', time: 'Yesterday' },
];

export function useDashboard() {
  const [stats] = useState(MOCK_STATS);
  const [recentActivity] = useState(MOCK_ACTIVITY);

  return { stats, recentActivity };
}
