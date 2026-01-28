/**
 * Basic client tests
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Tenant Intelligence System')).toBeInTheDocument();
  });

  test('displays navigation links', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Submit Complaint')).toBeInTheDocument();
    expect(screen.getByText('View Complaints')).toBeInTheDocument();
  });
});