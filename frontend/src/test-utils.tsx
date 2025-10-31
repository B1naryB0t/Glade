// frontend/src/test-utils.tsx
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

/**
 * Renders UI wrapped in React Query + Router providers for testing.
 * Optionally accepts a `route` to start at a specific URL.
 */
export function renderWithProviders(ui: React.ReactElement, route = "/") {
  const queryClient = new QueryClient();
  window.history.pushState({}, "Test page", route);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}
