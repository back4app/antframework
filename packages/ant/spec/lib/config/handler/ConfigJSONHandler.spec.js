/**
 * @fileoverview Tests for lib/config/handler/ConfigJSONHandler.js file.
 */

const ConfigJSONHandler = require('../../../../lib/config/handler/ConfigJSONHandler');

const handler = new ConfigJSONHandler();

describe('lib/config/handler/ConfigJSONHandler.js', () => {
  test('should export "ConfigJSONHandler" class', () => {
    expect(handler.constructor.name).toEqual('ConfigJSONHandler');
  });

  test('should contain the handle method', () => {
    expect(handler.handle).toBeDefined();
  });

  test('should do nothing if not overriden', () => {
    const params = {};
    handler.handle(params);
    expect(params).toEqual({});
  });
});
