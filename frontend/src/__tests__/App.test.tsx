// frontend/src/__tests__/App.test.tsx
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";

// -----------------------------------------
// Mocked Auth Context
// -----------------------------------------

type MockAuthState = {
  user: { username: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
};

let mockAuthState: MockAuthState = {
  user: { username: "tamara" },
  isAuthenticated: true,
  isLoading: false,
  logout: vi.fn(),
};

// Mock the useAuth hook before App import
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import App *after* the mock
import App from "../App";

// -----------------------------------------
// Reset state between tests
// -----------------------------------------

beforeEach(() => {
  mockAuthState = {
    user: { username: "tamara" },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  };
});

// -----------------------------------------
// Tests
// -----------------------------------------

describe("App component", () => {
  test("renders sign-in screen for unauthenticated users", async () => {
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    };

    renderWithProviders(<App />, { route: "/login" });

    expect(await screen.findByText(/sign in to glade/i)).toBeInTheDocument();
  });

  test("renders dashboard when user is authenticated", async () => {
    renderWithProviders(<App />, { route: "/" });
    expect(await screen.findByText(/home feed|dashboard/i)).toBeInTheDocument();
  });

  test("redirects unknown route to home", async () => {
    renderWithProviders(<App />, { route: "/random-page" });
    expect(await screen.findByText(/home feed|dashboard/i)).toBeInTheDocument();
  });
});
