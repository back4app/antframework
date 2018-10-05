/**
 * @fileoverview Tests for index.js file.
 */

const index = require('../');
const Ant = require('../lib/Ant');
const Config = require('../lib/config/Config');
const AntFunction = require('../lib/functions/AntFunction');
const BinFunction = require('../lib/functions/BinFunction');
const Runtime = require('../lib/functions/runtimes/Runtime');
const LibFunction = require('../lib/functions/LibFunction');
const Plugin = require('../lib/plugins/Plugin');
const Template = require('../lib/templates/Template');
const Provider = require('../lib/hosts/providers/Provider');
const Host = require('../lib/hosts/Host');

describe('index.js', () => {
  test('should export "Ant" class', () => {
    expect(index.Ant).toEqual(
      Ant
    );
  });

  test('should export "Config" class', () => {
    expect(index.Config).toEqual(
      Config
    );
  });

  test('should export "AntFunction" class', () => {
    expect(index.AntFunction).toEqual(
      AntFunction
    );
  });

  test('should export "BinFunction" class', () => {
    expect(index.BinFunction).toEqual(
      BinFunction
    );
  });

  test('should export "Runtime" class', () => {
    expect(index.Runtime).toEqual(
      Runtime
    );
  });

  test('should export "LibFunction" class', () => {
    expect(index.LibFunction).toEqual(
      LibFunction
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

  test('should export "Provider" class', () => {
    expect(index.Provider).toEqual(
      Provider
    );
  });

  test('should export "Host" class', () => {
    expect(index.Host).toEqual(
      Host
    );
  });
});
