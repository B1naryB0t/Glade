import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import PostCard from "../../components/PostCard";
import { AuthProvider, useAuth } from "../../hooks/useAuth";

// Mock react-query hooks so we don't trigger real network calls
vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock postService just to avoid import errors if used internally
vi.mock("../../services/postService", () => ({
  postService: {
    likePost: vi.fn(),
    unlikePost: vi.fn(),
  },
}));

describe("PostCard component", () => {
  const mockPost = {
    id: 1,
    author: {
      username: "tamara",
      display_name: "Tamara",
      avatar_url: "",
    },
    content: "Hello world!",
    created_at: new Date().toISOString(),
    likes_count: 3,
    replies_count: 2,
    is_liked: false,
    location: "Somewhere",
    visibility: 1,
  };

  it("renders post content and author info", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Hello world!")).toBeInTheDocument();
    expect(screen.getByText("Tamara")).toBeInTheDocument();
  });

  it("renders like button and allows clicking", async () => {
    render(<PostCard post={mockPost} />);
    const likeButton = screen.getByRole("button", { name: /3/i }); // the like count is shown
    expect(likeButton).toBeInTheDocument();
    await userEvent.click(likeButton);
    // no error should occur on click
  });
});

describe("AuthProvider context", () => {
  it("provides logged-in user context", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      ),
    });

    act(() => result.current.login("tamara", "demo123"));
    expect(result.current.user.username).toBe("tamara");
  });
});
