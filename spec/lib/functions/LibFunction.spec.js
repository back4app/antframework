/**
 * @fileoverview Tests for lib/functions/LibFunction.js file.
 */

const path = require('path');
const { Observable } = require('rxjs');
const { toArray } = require('rxjs/operators');
const LibFunction = require('../../../lib/functions/LibFunction');
const BinFunction = require('../../../lib/functions/BinFunction');

const fooRuntime = new BinFunction(
  'fooRuntime',
  path.resolve(__dirname, '../../support/functions/fooRuntime.js')
);

const libFunction = new LibFunction(
  'fooLibFunction',
  path.resolve(__dirname, '../../support/functions/fooLibFunction'),
  fooRuntime
);

describe('lib/functions/LibFunction.js', () => {
  test('should export "LibFunction" class', () => {
    expect(libFunction.constructor.name).toEqual('LibFunction');
  });

  test('should fail if handler is not String', () => {
    expect(() => new LibFunction('fooFunction')).toThrowError(
      'Could not initialize LibFunction: param "handler" should be String'
    );
    expect(() => new LibFunction('fooFunction', {})).toThrowError(
      'Could not initialize LibFunction: param "handler" should be String'
    );
  });

  test('should fail if runtime is not String', () => {
    expect(() => new LibFunction('fooFunction', 'fooHandler')).toThrowError(
      'Could not initialize LibFunction: param "runtime" should be String'
    );
    expect(() => new LibFunction('fooFunction', 'fooHandler', {})).toThrowError(
      'Could not initialize LibFunction: param "runtime" should be String'
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
      const binFunction = new BinFunction('fooBinFunction', 'it/will/fail');
      binFunction.run = () => { throw new Error('Some error'); };
      expect(() => {
        (new LibFunction(
          'fooLibFunction',
          'it/will/fail',
          binFunction
        )).run();
      }).toThrowError('Could not run lib function fooLibFunction');
    });
  });
});
