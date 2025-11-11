import React from "react";
import { describe, test, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import PostCard from "@/components/PostCard";

// Mock post data for tests
const mockPost = {
  id: 1,
  author: { username: "tamara" },
  content: "Hello Glade community!",
  likes: 5,
  created_at: "2025-10-29T12:00:00Z",
};

describe("PostCard component", () => {
  test("renders post content and author info", () => {
    renderWithProviders(<PostCard post={mockPost} />);

    // Check post text
    expect(screen.getByText(/hello glade community/i)).toBeInTheDocument();

    // Use role-based query to avoid duplicate text match
    const authorLink = screen.getByRole("link", { name: /tamara/i });
    expect(authorLink).toBeInTheDocument();

    // Also confirm @username text exists
    expect(screen.getByText(/@tamara/i)).toBeInTheDocument();
  });

  test("renders like button and allows clicking", () => {
    renderWithProviders(<PostCard post={mockPost} />);

    // Look for a heart icon or button labeled "Like"
    const buttons = screen.getAllByRole("button");
    const likeButton = buttons.find(
      (btn) =>
        btn.querySelector("svg.lucide-heart") ||
        btn.getAttribute("aria-label")?.match(/like/i)
    );

    expect(likeButton, "Expected to find heart icon or like button").toBeTruthy();

    if (likeButton) {
      fireEvent.click(likeButton);
    }

    // Optional: check for updated state, if implemented
    // expect(screen.getByText(/6 likes/i)).toBeInTheDocument();
  });

  test("renders post link correctly", () => {
    renderWithProviders(<PostCard post={mockPost} />);
    const link = screen.getByRole("link", { name: /tamara/i });
    expect(link).toHaveAttribute("href", expect.stringMatching(/\/profile\/tamara/i));
  });
});
