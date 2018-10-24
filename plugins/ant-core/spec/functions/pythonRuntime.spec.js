/**
 * @fileoverview Tests for pythonRuntime.py file.
 */

const path = require('path');
const { Ant, LibFunction } = require('@back4app/ant');
const Core = require('../../lib/Core');
const { toArray } = require('rxjs/operators');

const ant = new Ant();

const PYTHON_FUNCS_PATH = path.resolve(__dirname, '../support/functions/python');
const stringResultFunction = path.resolve(PYTHON_FUNCS_PATH, 'stringResultFunction.py');
const integerResultFunction = path.resolve(PYTHON_FUNCS_PATH, 'integerResultFunction.py');
const objectResultFunction = path.resolve(PYTHON_FUNCS_PATH, 'objectResultFunction.py');
const listResultFunction = path.resolve(PYTHON_FUNCS_PATH, 'listResultFunction.py');
const raiseExceptionFunction = path.resolve(PYTHON_FUNCS_PATH, 'raiseExceptionFunction.py');
const echoParamFunction = path.resolve(PYTHON_FUNCS_PATH, 'echoParamFunction.py');

describe('pythonRuntime.py', () => {
  describe('should execute a function and', () => {
    const assertFunctionExecution = async (funcPath, expected, params, flattenParams) => {
      const core = new Core(ant);
      const python = core.ant.runtimeController.getRuntime('Python', '2');
      const func = new LibFunction(new Ant(), 'func', funcPath, python);
      const observable = flattenParams ? func.run(...params) : func.run(params);
      const result = flattenParams ? await observable.pipe(toArray()).toPromise() : await observable.toPromise();
      expect(result).toEqual(expected);
    };

    test('return a string', async () => {
      await assertFunctionExecution(stringResultFunction, 'foo');
    });

    test('return an integer', async () => {
      await assertFunctionExecution(integerResultFunction, 1);
    });

    test('return an object', async () => {
      await assertFunctionExecution(objectResultFunction, { 'foo' : 'bar' });
    });

    test('return a list', async () => {
      await assertFunctionExecution(listResultFunction, [
        'foo',
        1,
        { 'foo': 'bar' }
      ]);
    });

    test('handle the raised exception', async () => {
      await assertFunctionExecution(
        raiseExceptionFunction,
        expect.stringContaining('Exception: Mocked error')
      );
    });

    test('echo a string param', async () => {
      await assertFunctionExecution(echoParamFunction, 'param', 'param');
    });

    test('echo an integer param', async () => {
      await assertFunctionExecution(echoParamFunction, 1, 1);
    });

    test('echo an object param', async () => {
      await assertFunctionExecution(
        echoParamFunction,
        { 'foo' : 'bar' },
        { 'foo' : 'bar' }
      );
    });

    test('echo a list param', async () => {
      await assertFunctionExecution(
        echoParamFunction,
        ['foo', 1, { 'foo' : 'bar' }],
        ['foo', 1, { 'foo' : 'bar' }]
      );
    });

    test('echo multiple params', async () => {
      await assertFunctionExecution(
        echoParamFunction,
        ['foo', 1, { 'foo' : 'bar' }],
        ['foo', 1, { 'foo' : 'bar' }],
        true
      );
    });
  });
});
