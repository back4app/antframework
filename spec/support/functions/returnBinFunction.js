#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * @fileoverview Foo bin function that returns a value for testing purposes.
 */

console.log('Some initial log');
console.error('Some error log');
console.log('Some other log');
console.log(JSON.stringify({ result: 'Foo result' }));
process.exit(0);
