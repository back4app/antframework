/**
 * @fileoverview Tests for lib/plugins/graphQL/functions/resolve.js file.
 */

const path = require('path');
const logger = require('../../../../../lib/util/logger');
const AntError = require('../../../../../lib/util/AntError');
const Ant = require('../../../../../lib/Ant');
const AntFunction = require('../../../../../lib/functions/AntFunction');
const resolve = require('../../../../../lib/plugins/graphQL/functions/resolve');

describe('lib/plugins/graphQL/functions/resolve.js', () => {
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
        __dirname,
        '../../../../support/functions'
      )
    });
    const model = { field: { astNode: { type: { kind: 'ListType' }}}};
    expect(await resolve(ant, { to: 'fooLibFunction' }, 3, undefined, model))
      .toEqual([1, 2, 3]);
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
        __dirname,
        '../../../../support/functions'
      )
    });
    const model = { field: { astNode: { type: { kind: 'ListType' }}}};
    expect(await resolve(ant, { to: 'fooLibFunction' }, 3, 2, model)).toEqual([1, 2]);
  });
});
