/**
 * @fileoverview Tests for lib/plugins/core/lib/Core.js file.
 */

const path = require('path');
const fs = require('fs');
const AntCli = require('../../../../../lib/cli/AntCli');
const Ant = require('../../../../../lib/Ant');
const Plugin = require('../../../../../lib/plugins/Plugin');
const Core = require('../../../../../lib/plugins/core/lib/Core');

const ant = new Ant();

describe('lib/plugins/core/lib/Core.js', () => {
  test('should export "Core" class extending "Plugin" class', () => {
    const core = new Core(ant);
    expect(core.constructor.name).toEqual('Core');
    expect(core).toBeInstanceOf(Plugin);
    expect(core.name).toEqual('Core');
  });

  describe('Core.loadYargsSettings', () => {
    test('should load "create" command', (done) => {
      const originalCwd = process.cwd();
      process.chdir(path.resolve(__dirname, '../'));
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(code).toEqual(0);
        process.chdir(originalCwd);
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create MyService');
    });
  });

  describe('Core.createService', () => {
    test('should be async', async () => {
      const core = new Core(ant);
      const createServiceReturn = core.createService();
      expect(createServiceReturn).toBeInstanceOf(Promise);
    });

    test('should fail if name and template params are not String', async () => {
      expect.hasAssertions();
      const core = new Core(ant);
      await expect(core.createService()).rejects.toThrow(
        'Could not create service: param "name" is required'
      );
      await expect(core.createService('')).rejects.toThrow(
        'Could not create service: param "name" is required'
      );
      await expect(core.createService({})).rejects.toThrow(
        'Could not create service: param "name" should be String'
      );
      await expect(core.createService('MyService', {})).rejects.toThrow(
        'Could not create service: param "template" should be String'
      );
    });

    test('should fail if a folder with the service name already exists', () => {
      expect.hasAssertions();
      const core = new Core(ant);
      fs.mkdirSync('MyService');
      expect(core.createService('MyService')).rejects.toThrow(
        'Could not create service: path'
      );
      fs.rmdirSync('MyService');
    });
  });
});
