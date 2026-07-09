import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_gkaupycpueqymbqlvcgy",
  runtime: "node",
  logLevel: "info",
  maxDuration: 300,
  dirs: ["./src"],
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
