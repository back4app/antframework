/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/core/lib/Core.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const AntCli = require('../../../../../lib/cli/AntCli');
const Ant = require('../../../../../lib/Ant');
const Plugin = require('../../../../../lib/plugins/Plugin');
const Core = require('../../../../../lib/plugins/core/lib/Core');

const ant = new Ant();

describe('lib/plugins/core/lib/Core.js', () => {
  const originalCwd = process.cwd();
  const outPath = path.resolve(__dirname, 'out');

  beforeEach(() => {
    try {
      fs.removeSync(outPath);
    } finally {
      try {
        fs.mkdirSync(outPath);
      } finally {
        process.chdir(outPath);
      }
    }
  });

  afterEach(() => {
    try {
      fs.removeSync(outPath);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('should export "Core" class extending "Plugin" class', () => {
    const core = new Core(ant);
    expect(core.constructor.name).toEqual('Core');
    expect(core).toBeInstanceOf(Plugin);
    expect(core.name).toEqual('Core');
  });

  describe('Core.loadYargsSettings', () => {
    test('should load "create" command', (done) => {
      const originalLog = console.log;
      console.log = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Service "MyService" successfully created')
        );
        expect(code).toEqual(0);
        console.log = originalLog;
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create MyService');
    });

    test('should show friendly errors', (done) => {
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Could not create service: template "NotExistent" was not found'
          )
        );
        expect(code).toEqual(1);
        console.error = originalError;
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create MyService --template NotExistent');
    });

    test('should show error stack in verbose mode', (done) => {
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Error stack:'
          )
        );
        expect(code).toEqual(1);
        console.error = originalError;
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create -v MyService --template NotExistent');
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
        'Could not render template: path'
      );
      fs.rmdirSync('MyService');
    });
  });
});
