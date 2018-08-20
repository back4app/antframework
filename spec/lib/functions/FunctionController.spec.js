/**
 * @fileoverview Tests for lib/functions/FunctionController.js file.
 */

const AntError = require('../../../lib/util/AntError');
const logger = require('../../../lib/util/logger');
const Ant = require('../../../lib/Ant');
const Plugin = require('../../../lib/plugins/Plugin');
const AntFunction = require('../../../lib/functions/AntFunction');
const FunctionController = require('../../../lib/functions/FunctionController');

const ant = new Ant();
const functionController = new FunctionController(ant);

describe('lib/functions/FunctionController.js', () => {
  test('should export "FunctionController" class', () => {
    expect(functionController.constructor.name).toEqual('FunctionController');
  });

  test('should load plugins\' functions', () => {
    const antWithFunctions = new Ant();

    const function1 = new AntFunction(antWithFunctions, 'function1');
    const function2 = new AntFunction(antWithFunctions, 'function2');
    const function2v2 = new AntFunction(antWithFunctions, 'function2');

    /**
     * Represents a {@link Plugin} with functions for testing purposes.
     * @extends Plugin
     * @private
     */
    class PluginWithFunctions extends Plugin {
      get functions() {
        return [function1, function2, function2v2];
      }
    }

    antWithFunctions.pluginController.loadPlugins([PluginWithFunctions]);
    expect(antWithFunctions.functionController.functions)
      .toEqual(expect.any(Array));
    expect(
      antWithFunctions.functionController.functions[0]
    ).toEqual(function1);
    expect(
      antWithFunctions.functionController.functions[1]
    ).toEqual(function2v2);
  });

  test('should fail if "ant" param is not passed', () => {
    expect(() => new FunctionController()).toThrowError(
      'Could not initialize the function controller: param "ant" is required'
    );
  });

  test('should fail if "ant" param is not Ant', () => {
    expect(() => new FunctionController({})).toThrowError(
      'Could not initialize the function controller: param "ant" should be Ant'
    );
  });

  test('should fail to load functions due to invalid param type', () => {
    expect(() => new FunctionController(
      ant,
      'invalid_function_config'
    )).toThrowError(
      'Could not load functions: param "functions" should be Array'
    );
    expect(() => new FunctionController(
      ant,
      [() => {}]
    )).toThrowError(
      'should be an instance of AntFunction'
    );
  });

  test('should load functions', () => {
    const myCustomFunction = new AntFunction(ant, 'myCustomFunction');
    const functions = [myCustomFunction];
    const functionController = new FunctionController(ant, functions);
    expect(() => functionController.getFunction(
      myCustomFunction.name).toEqual(myCustomFunction));
  });

  test('should log an error if basePath cannot be read', () => {
    const fakeError = jest.fn();
    logger.attachErrorHandler(fakeError);
    const ant = new Ant({ basePath: '/foo/path' });
    new FunctionController(ant);
    expect(fakeError)
      .toHaveBeenCalledWith(expect.any(AntError));
    logger._errorHandlers.delete(fakeError);
  });

  describe('FunctionController.ant', () => {
    test('should be readonly', () => {
      expect(functionController.ant).toEqual(ant);
      functionController.ant = new Ant();
      expect(functionController.ant).toEqual(ant);
    });
  });

  describe('FunctionController.getFunction', () => {
    test('should return null if function not found', () => {
      expect(functionController.getFunction('NotExistent'))
        .toEqual(null);
    });
  });
});
