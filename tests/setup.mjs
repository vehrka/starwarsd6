import { foundryMock } from "./mocks/foundry.mjs";

// Install Foundry globals on globalThis BEFORE any module import resolves them.
// This must run first — setupFiles executes before test file imports.
globalThis.foundry = foundryMock;
