import { createBrowserRouter } from 'react-router';

import GuestOnly from '../features/auth/components/GuestOnly.jsx';
import RequireAuth from '../features/auth/components/RequireAuth.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import ExpenseSummaryPage from '../pages/ExpenseSummaryPage.jsx';
import ExpensesPage from '../pages/ExpensesPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import JournalPage from '../pages/JournalPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import NewTripPage from '../pages/NewTripPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import TripPage from '../pages/TripPage.jsx';
import TripSettingsPage from '../pages/TripSettingsPage.jsx';

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/trips/new', element: <NewTripPage /> },
          { path: '/trips/:tripId', element: <TripPage /> },
          { path: '/trips/:tripId/settings', element: <TripSettingsPage /> },
          { path: '/trips/:tripId/expenses', element: <ExpensesPage /> },
          { path: '/trips/:tripId/summary', element: <ExpenseSummaryPage /> },
          { path: '/trips/:tripId/journal', element: <JournalPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
