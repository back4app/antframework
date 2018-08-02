/**
 * @fileoverview Tests for index.js file.
 */

const index = require('../');
const Ant = require('../lib/Ant');
const Plugin = require('../lib/plugins/Plugin');
const Template = require('../lib/templates/Template');
const Core = require('../lib/plugins/core/lib/Core');
const GraphQL = require('../lib/plugins/graphQL/lib/GraphQL');
const util = require('../lib/util');

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

  test('should export "Template" class', () => {
    expect(index.Template).toEqual(
      Template
    );
  });

  test('should export "GraphQL" class', () => {
    expect(index.GraphQL).toEqual(
      GraphQL
    );
  });

  test('should export "Core" class', () => {
    expect(index.Core).toEqual(
      Core
    );
  });

  test('should export "util" module', () => {
    expect(index.util).toEqual(
      util
    );
  });
});
