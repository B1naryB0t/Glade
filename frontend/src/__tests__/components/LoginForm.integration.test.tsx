// frontend/src/__tests__/components/LoginForm.integration.test.tsx
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import LoginForm from "../../components/LoginForm";
import { server } from "../../hooks/server";
import { http, HttpResponse } from "msw";

describe("LoginForm integration", () => {
  test("logs in successfully", async () => {
    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/username/i), { 
      target: { value: "testuser" }
    });

    fireEvent.change(screen.getByLabelText(/password/i), 
    { target: { value: "password" } });


    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() =>
      expect(screen.getByText(/welcome!/i)).toBeInTheDocument()
    );
  });

  test("shows error on failed login", async () => {
    //  Override login handler temporarily
    server.use(
      http.post("/api/login", () => {
        return HttpResponse.json({ error: "Bad credentials" }, { status: 401 });
      })
    );

    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() =>
      expect(screen.getByText(/please enter credentials/i)).toBeInTheDocument()
    );
  });
});
