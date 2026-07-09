import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_gkaupycpueqymbqlvcgy",
  runtime: "node",
  logLevel: "info",
  retries: {
    enabled: true,
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 60000,
    factor: 2,
    randomize: true,
  },
  build: {
    extensions: [],
  },
});
