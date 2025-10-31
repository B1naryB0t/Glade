// frontend/src/__tests__/App.test.tsx
import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";

// 👇 mutable auth state
// Define the shape explicitly
let mockAuthState: {
  user: { username: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
} = {
  user: { username: "tamara" },
  isAuthenticated: true,
  isLoading: false,
  logout: vi.fn(),
};


// 👇 mock first — before App import
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import App from "../App"; // imported after mock ✅

beforeEach(() => {
  mockAuthState = {
    user: { username: "tamara" },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  };
});

describe("App component", () => {
  test("renders sign-in screen for unauthenticated users", async () => {
    mockAuthState = { user: null, isAuthenticated: false, isLoading: false, logout: vi.fn() };

    renderWithProviders(<App />, "/login");

    expect(await screen.findByText(/sign in to glade/i)).toBeInTheDocument();
  });

  test("renders dashboard when user is authenticated", async () => {
    renderWithProviders(<App />, "/");
    expect(await screen.findByText(/home|dashboard/i)).toBeInTheDocument();
  });

  test("redirects unknown route to home", async () => {
    renderWithProviders(<App />, "/random-page");
    expect(await screen.findByText(/home|dashboard/i)).toBeInTheDocument();
  });
});
