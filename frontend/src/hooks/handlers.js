// frontend/src/__tests__/mocks/handlers.js
import { http, HttpResponse } from "msw";

export const handlers = [
  // 🧠 Mock login endpoint
  http.post("/api/login", async ({ request }) => {
    const body = await request.json();
    if (body.username === "testuser" && body.password === "password") {
      return HttpResponse.json(
        { token: "fake-jwt-token", user: { username: "testuser" } },
        { status: 200 }
      );
    }
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // 🧠 Mock feed endpoint
  http.get("/api/feed", () => {
    return HttpResponse.json([
      { id: 1, title: "Welcome to Glade", author: "admin" },
      { id: 2, title: "Second post!", author: "testuser" },
    ]);
  }),

  // 🧠 Mock post creation
  http.post("/api/posts", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: Math.random(), ...body, createdAt: new Date().toISOString() },
      { status: 201 }
    );
  }),
];
