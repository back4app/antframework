/**
 * @fileoverview Tests for lib/functions/LibFunction.js file.
 */

const path = require('path');
const { Observable } = require('@back4app/ant-util-rxjs/node_modules/rxjs');
const { toArray } = require('@back4app/ant-util-rxjs/node_modules/rxjs/operators');
const Ant = require('../../../lib/Ant');
const LibFunction = require('../../../lib/functions/LibFunction');
const Runtime = require('../../../lib/functions/runtimes/Runtime');

const utilPath = path.resolve(
  __dirname,
  '../../../node_modules/@back4app/ant-util-tests'
);

const ant = new Ant();

const fooRuntime = new Runtime(
  ant,
  'fooRuntime',
  path.resolve(utilPath, 'functions/fooRuntime.js')
);

const libFunction = new LibFunction(
  ant,
  'fooLibFunction',
  path.resolve(utilPath, 'functions/fooLibFunction'),
  fooRuntime
);

const undefinedlibFunction = new LibFunction(
  ant,
  'undefinedLibFunction',
  path.resolve(utilPath, 'functions/undefinedLibFunction'),
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

  test('should fail if runtime is not Runtime', () => {
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

    test('should run and handle undefined result', async () => {
      const runReturn = undefinedlibFunction.run();
      expect(runReturn).toEqual(expect.any(Observable));
      expect(await runReturn.toPromise())
        .toEqual(undefined);
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
