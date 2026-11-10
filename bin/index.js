#!/usr/bin/env node

import { startServer } from '../src/index.js';

startServer().catch((error) => {
  console.error('[snippkit-mcp] Fatal server startup error:', error);
  process.exit(1);
});
