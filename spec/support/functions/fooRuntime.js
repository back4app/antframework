#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * @fileoverview Foo runtime for testing purposes.
 */

require(process.argv[2])(...JSON.parse(process.argv[3])).subscribe(
  data => console.log(JSON.stringify(data)),
  err => {
    console.error(err);
    process.exit(1);
  },
  () => process.exit(0)
);
