/**
 * Always run the backend server from nexus-ai root so frontend dist is found.
 * Usage: node scripts/start-server.js  (or npm run start:server from nexus-ai)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
process.chdir(root);
await import("../backend/dist/server.js");
