// frontend/src/__tests__/components/Navbar.test.tsx
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import Navbar from "../../components/Navbar";
import React from "react";

// 🧩 Define this before any mocks
const mockLogout = vi.fn();

// ✅ Mock useAuth with AuthProvider included
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { username: "testuser", display_name: "Test User" },
    logout: mockLogout,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

// ✅ Mock useLocation
vi.mock("../../hooks/useLocation", () => ({
  useLocation: () => ({
    hasLocation: true,
    requestLocation: vi.fn(),
  }),
}));

// ✅ Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("Navbar", () => {
  test("renders logo text and brand letter", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("Glade")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  test("renders logged-in user info", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
  });

  test("renders location and logout controls", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText(/located/i)).toBeInTheDocument();
  });

  test("calls logout when logout button clicked", () => {
    renderWithProviders(<Navbar />);
    const logoutButtons = screen.getAllByRole("button");
    logoutButtons.forEach((btn) => {
      if (btn.querySelector("svg")) {
        fireEvent.click(btn);
      }
    });
    expect(mockLogout).toHaveBeenCalled();
  });
});
