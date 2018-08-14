#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * @fileoverview Node.js runtime for Ant Framework.
 */

const { Observable } = require('rxjs');

let output = null;

try {
  output = require(process.argv[2])(...JSON.parse(process.argv[3]));
} catch (e) {
  console.error(e);
  process.exit(1);
}

if (output instanceof Observable) {
  output.subscribe(
    data => console.log(JSON.stringify(data)),
    err => {
      console.error(err);
      process.exit(1);
    },
    () => process.exit(0)
  );
} else if (output instanceof Promise) {
  output
    .then(data => {
      console.log(JSON.stringify(data));
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  console.log(JSON.stringify(output));
  process.exit(0);
}
