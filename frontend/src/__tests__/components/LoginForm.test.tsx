import { render, screen, fireEvent } from "@testing-library/react";
import LoginForm from "../../components/LoginForm";

test("renders login form and submits", async () => {
  render(<LoginForm />);

  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: "user" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
});
