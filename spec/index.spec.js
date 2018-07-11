/**
 * @fileoverview Tests for index.js file.
 */

const index = require('../');
const Ant = require('../lib/Ant');
const Plugin = require('../lib/plugins/Plugin');

describe('index.js', () => {
  test('should export "Ant" class', () => {
    expect(index.Ant).toEqual(
      Ant
    );
  });

  test('should export "Plugin" class', () => {
    expect(index.Plugin).toEqual(
      Plugin
    );
  });
});
