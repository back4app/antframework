/**
 * @fileoverview Tests for lib/plugins/core/lib/Core.js file.
 */

const path = require('path');
const AntCli = require('../../../../../lib/cli/AntCli');
const Plugin = require('../../../../../lib/plugins/Plugin');

describe('lib/plugins/core/lib/Core.js', () => {
  test('should export "Core" class extending "Plugin" class', () => {
    const Core = require('../../../../../lib/plugins/core/lib/Core');
    const core = new Core();
    expect(core.constructor.name).toEqual('Core');
    expect(core).toBeInstanceOf(Plugin);
    expect(core.name).toEqual('Core');
  });

  describe('Core.loadYargsSettings', () => {
    test('should load "create" command', () => {
      const originalExit = process.exit;
      process.exit = jest.fn();
      const originalCwd = process.cwd();
      process.chdir(path.resolve(__dirname, '../'));
      try {
        (new AntCli())._yargs.parse('create MyService');
        expect(process.exit).toHaveBeenCalledWith(0);
      } catch (e) {
        throw e;
      } finally {
        process.exit = originalExit;
        process.chdir(originalCwd);
      }
    });
  });
});
