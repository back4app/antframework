/**
 * @fileoverview Tests for lib/functions/LibFunction.js file.
 */

const path = require('path');
const { Observable } = require('rxjs');
const { toArray } = require('rxjs/operators');
const Ant = require('../../../lib/Ant');
const LibFunction = require('../../../lib/functions/LibFunction');
const Runtime = require('../../../lib/functions/runtimes/Runtime');

const ant = new Ant();

const fooRuntime = new Runtime(
  ant,
  'fooRuntime',
  path.resolve(__dirname, '../../support/functions/fooRuntime.js')
);

const libFunction = new LibFunction(
  ant,
  'fooLibFunction',
  path.resolve(__dirname, '../../support/functions/fooLibFunction'),
  fooRuntime
);

describe('lib/functions/LibFunction.js', () => {
  test('should export "LibFunction" class', () => {
    expect(libFunction.constructor.name).toEqual('LibFunction');
  });

  test('should fail if handler is not String', () => {
    expect(() => new LibFunction(ant, 'fooFunction')).toThrowError(
      'Could not initialize LibFunction: param "handler" should be String'
    );
    expect(() => new LibFunction(ant, 'fooFunction', {})).toThrowError(
      'Could not initialize LibFunction: param "handler" should be String'
    );
  });

  test('should fail if runtime is not String', () => {
    expect(() => new LibFunction(ant, 'fooFunction', 'fooHandler')).toThrowError(
      'Could not initialize LibFunction: param "runtime" should be Runtime'
    );
    expect(() => new LibFunction(ant, 'fooFunction', 'fooHandler', {})).toThrowError(
      'Could not initialize LibFunction: param "runtime" should be Runtime'
    );
  });

  describe('LibFunction.run', () => {
    test('should export Observable', async () => {
      const runReturn = libFunction.run(3);
      expect(runReturn).toEqual(expect.any(Observable));
      expect(await runReturn.pipe(toArray()).toPromise())
        .toEqual([1, 2, 3]);
    });

    test('should fail if runtime fails', () => {
      const runtime = new Runtime(
        ant,
        'fooBinFunction',
        'it/will/fail'
      );
      runtime.run = () => { throw new Error('Some error'); };
      expect(() => {
        (new LibFunction(
          ant,
          'fooLibFunction',
          'it/will/fail',
          runtime
        )).run();
      }).toThrowError('Could not run lib function fooLibFunction');
    });
  });
});
