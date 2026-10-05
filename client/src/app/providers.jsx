import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../lib/queryClient.js';

// รวม provider ระดับแอปไว้ที่เดียว (AuthProvider จะมาเพิ่มตรงนี้ใน F1.2)
export default function Providers({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
