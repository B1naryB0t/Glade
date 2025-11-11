// frontend/src/__tests__/mocks/server.js
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// This server intercepts network requests in tests
export const server = setupServer(...handlers);
