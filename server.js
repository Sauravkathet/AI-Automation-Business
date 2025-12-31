#!/usr/bin/env node
/*
  Lightweight entrypoint for running the backend.
  - If a compiled build exists at ./dist/server.js it is required (production).
  - Otherwise, it tries to run ./src/server.ts using ts-node (development).
*/

const fs = require('fs');
const path = require('path');

const distServer = path.join(__dirname, 'dist', 'server.js');
const srcServer = path.join(__dirname, 'src', 'server.ts');

if (fs.existsSync(distServer)) {
  // Run the compiled server
  require(distServer);
} else if (fs.existsSync(srcServer)) {
  try {
    // Prefer running via ts-node when available
    require('ts-node').register({ transpileOnly: true });
    require(srcServer);
  } catch (err) {
    console.error('\nError: cannot run : please check the datas entrypoint because ts-node is not available.');
    console.error('Install it as a dev dependency: `npm i -D ts-node` or build the project with `npm run build`.');
    console.error(err);
    process.exit(1);
  }
} else {
  console.error('\nError: No server entrypoint found. Expected one of:');
  console.error('  - ' + distServer);
  console.error('  - ' + srcServer);
  process.exit(1);
}
