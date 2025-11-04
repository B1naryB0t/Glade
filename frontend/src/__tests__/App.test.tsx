import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import App from "../App";

test("renders app shell", () => {
  renderWithProviders(<App />);
  expect(screen.getByText(/sign in to glade/i)).toBeInTheDocument();
});
