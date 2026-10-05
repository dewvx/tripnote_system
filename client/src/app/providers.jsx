import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '../context/AuthContext.jsx';
import { queryClient } from '../lib/queryClient.js';

// รวม provider ระดับแอปไว้ที่เดียว
export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
