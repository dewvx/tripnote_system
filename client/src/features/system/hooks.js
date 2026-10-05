import { useQuery } from '@tanstack/react-query';

import { getHealth } from './api.js';

export function useHealth() {
  return useQuery({ queryKey: ['system', 'health'], queryFn: getHealth });
}
