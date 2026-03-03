import { useState } from 'react';

const MOCK_DELIVERIES = [
  { id: 1, number: '85201613', carrier: 'DHL Transport', status: 'received', items: 4, project: 'C-26-0042', date: '2026-02-28' },
  { id: 2, number: '85201620', carrier: 'FedEx Freight', status: 'in_transit', items: 2, project: 'C-26-0038', date: '2026-03-01' },
  { id: 3, number: '85201625', carrier: 'UPS', status: 'pending', items: 6, project: 'C-26-0042', date: '2026-03-03' },
];

export function useDeliveries() {
  const [deliveries] = useState(MOCK_DELIVERIES);

  return { deliveries };
}
