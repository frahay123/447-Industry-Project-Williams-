import { useState } from 'react';

const MOCK_ITEMS = [
  { id: 1, description: 'Ceiling Diffuser ', quantity: 24, location: 'warehouse', project: 'C-26-0042' },
  { id: 2, description: 'Copper Pipe 3/4 x 10ft', quantity: 150, location: 'yard', project: 'C-26-0038' },
  { id: 3, description: 'PVC Pipe 10ft"', quantity: 85, location: 'jobsite', project: 'C-26-0038' },
  { id: 4, description: 'Circuit Breaker 20AMP', quantity: 30, location: 'warehouse', project: 'C-26-0035' },
  { id: 5, description: 'Flex Duct 12 x 25ft', quantity: 12, location: 'transit', project: 'C-26-0042' },
];

export function useInventory() {
  const [items] = useState(MOCK_ITEMS);

  return { items };
}
