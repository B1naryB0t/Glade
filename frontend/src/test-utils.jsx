// frontend/src/test-utils.jsx
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth";

// A single QueryClient instance for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

// Custom render function that wraps with all providers
export function renderWithProviders(ui, { route = "/", ...options } = {}) {
  const queryClient = createTestQueryClient();

  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{ui}</AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
    options
  );
}

export function renderWithProvidersNoRouter(ui, options = {}) {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
    options
  );
}

// Re-export everything from RTL for convenience
export * from "@testing-library/react";
