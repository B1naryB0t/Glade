import "@testing-library/jest-dom";
import { server } from "./hooks/server";

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we add during tests
afterEach(() => server.resetHandlers());

// Clean up once the tests are done
afterAll(() => server.close());
