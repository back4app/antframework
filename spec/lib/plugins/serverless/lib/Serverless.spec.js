/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/serverless/lib/Serverless.js file.
 */

const Ant = require('../../../../../lib/Ant');
const Plugin = require('../../../../../lib/plugins/Plugin');
const Serverless = require(
  '../../../../../lib/plugins/serverless/lib/Serverless'
);

const ant = new Ant();

describe('lib/plugins/serverless/lib/Serverless.js', () => {
  test('should export "Serverless" class extending "Plugin" class', () => {
    const serverless = new Serverless(ant);
    expect(serverless.constructor.name).toEqual('Serverless');
    expect(serverless).toBeInstanceOf(Plugin);
    expect(serverless.name).toEqual('Serverless');
  });

  describe('Serverless.templates', () => {
    test('should be readonly and export default serverless template', () => {
      const serverless = new Serverless(ant);
      const templates = serverless.templates;
      serverless.templates = [];
      expect(serverless.templates).toEqual(templates);
      expect(templates).toEqual(expect.any(Array));
      expect(templates).toHaveLength(1);
      expect(templates[0].category).toEqual('Serverless');
      expect(templates[0].name).toEqual('Default');
    });
  });

  describe('Serverless.providers', () => {
    test('should be readonly and export serverless provider', () => {
      const serverless = new Serverless(ant);
      const providers = serverless.providers;
      serverless.providers = [];
      expect(serverless.providers).toEqual(providers);
      expect(providers).toEqual(expect.any(Array));
      expect(providers).toHaveLength(1);
      expect(providers[0].name).toEqual('Serverless');
    });
  });

  describe('Serverless.deploy', () => {
    test(
      'should build .serverless folder and call serverless CLI deploy command',
      () => {}
    );
  });
});
