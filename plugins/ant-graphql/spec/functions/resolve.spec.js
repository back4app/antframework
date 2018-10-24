/**
 * @fileoverview Tests for functions/resolve.js file.
 */

const path = require('path');
const { AntError, logger } = require('@back4app/ant-util');
const { Ant, AntFunction } = require('@back4app/ant');
const resolve = require('../../functions/resolve');

const utilPath = path.resolve(
  __dirname,
  '../../node_modules/@back4app/ant-util-tests'
);

describe('functions/resolve.js', () => {
  test('should export a function', () => {
    expect(typeof resolve).toEqual('function');
  });

  test('should return null if resolve args were not passed', async () => {
    expect(await resolve(null, null)).toEqual(null);
  });

  test('should use function to resolve', async () => {
    const ant = new Ant();
    ant.functionController.loadFunctions([
      new AntFunction(ant, 'fooFunction', () => 'foo output')
    ]);
    expect(await resolve(ant, { to: 'fooFunction' })).toEqual('foo output');
  });

  test('should find path if not a loaded function', async () => {
    const ant = new Ant({
      basePath: path.resolve(
        utilPath,
        'functions'
      )
    });
    const model = { field: { astNode: { type: { kind: 'ListType' }}}};
    expect(await resolve(ant, { to: 'fooLibFunction' }, 3, undefined, model))
      .toEqual([1, 2, 3]);
    expect(await resolve(ant, { to: 'fooLibFunction' }, 1, undefined, null))
      .toEqual(1);
  });

  test('should log error if function not found', async () => {
    const error = jest.fn();
    logger.attachErrorHandler(error);
    const ant = new Ant();
    expect(await resolve(ant, { to: 'fooFunction' })).toEqual(null);
    expect(error).toHaveBeenCalledWith(expect.any(
      AntError
    ));
    logger._errorHandlers.delete(error);
  });

  test('should log error if function fails', async () => {
    const error = jest.fn();
    logger.attachErrorHandler(error);
    const ant = new Ant();
    ant.functionController.loadFunctions([
      new AntFunction(ant, 'fooFunction', () => { throw new Error('Foo error'); })
    ]);
    expect(await resolve(ant, { to: 'fooFunction' })).toEqual(null);
    expect(error).toHaveBeenCalledWith(expect.any(
      AntError
    ));
    logger._errorHandlers.delete(error);
  });

  test('should use current value if passed', async () => {
    const ant = new Ant({
      basePath: path.resolve(
        utilPath,
        'functions'
      )
    });
    const model = { field: { astNode: { type: { kind: 'ListType' }}}};
    expect(await resolve(ant, { to: 'fooLibFunction' }, 3, 2, model)).toEqual([1, 2]);
  });

  test('should resolve arrays as return value', async () => {
    const ant = new Ant({
      basePath: path.resolve(
        utilPath,
        'functions'
      )
    });
    const model = { field: { astNode: { type: { kind: 'ListType' }}}};
    expect(await resolve(ant, { to: 'barLibFunction' }, 3, undefined, model)).toEqual([1, 1, 1]);
  });
});
