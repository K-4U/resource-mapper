#!/usr/bin/env node

import('../dist/cli.js').then(module => {
  module.run();
}).catch(err => {
  console.error('Failed to start resource-mapper:', err);
  process.exit(1);
});
