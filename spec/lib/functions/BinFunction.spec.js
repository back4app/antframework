/**
 * @fileoverview Tests for lib/functions/BinFunction.js file.
 */

const path = require('path');
const childProcess = require('child_process');
const { Observable } = require('rxjs');
const { toArray } = require('rxjs/operators');
const logger = require('../../../lib/util/logger');
const Ant = require('../../../lib/Ant');
const BinFunction = require('../../../lib/functions/BinFunction');

const ant = new Ant();
const binFunction = new BinFunction(ant, 'fooFunction', 'ls');

describe('lib/functions/BinFunction.js', () => {
  test('should export "BinFunction" class', () => {
    expect(binFunction.constructor.name).toEqual('BinFunction');
  });

  test('should fail if the bin is not String', () => {
    expect(() => new BinFunction(ant, 'fooFunction')).toThrowError(
      'Could not initialize BinFunction: param "bin" should be String'
    );
    expect(() => new BinFunction(ant, 'fooFunction', {})).toThrowError(
      'Could not initialize BinFunction: param "bin" should be String'
    );
  });

  describe('BinFunction.run', () => {
    test('should export Observable', async () => {
      const runReturn = binFunction.run();
      expect(runReturn).toEqual(expect.any(Observable));
      expect(await runReturn.pipe(toArray()).toPromise())
        .toEqual(expect.any(Array));
    });

    test('should work with args', async () => {
      const runReturn = binFunction.run(['-la']);
      expect(runReturn).toEqual(expect.any(Observable));
      expect((await runReturn.pipe(toArray()).toPromise()).join(''))
        .toEqual(expect.any(String));
    });

    test('should fail with invalid args', () => {
      expect(() => { binFunction.run({}); }).toThrowError(
        'Could not run bin function: param "args" should be Array of String'
      );
      expect(() => { binFunction.run([{}]); }).toThrowError(
        'Could not run bin function: param "args" should be Array of String'
      );
    });

    test('should fail if spawn fails', () => {
      const originalSpawn = childProcess.spawn;
      childProcess.spawn = jest.fn(() => { throw new Error('Some error'); });
      expect(binFunction.run().toPromise()).rejects.toThrowError(
        'Could not spawn "fooFunction" bin function process'
      );
      childProcess.spawn = originalSpawn;
    });

    test('should log using logger and return the bin output', async () => {
      const logHandler = jest.fn();
      const errorHandler = jest.fn();
      logger.attachHandler(logHandler);
      logger.attachErrorHandler(errorHandler);
      expect((await (new BinFunction(
        ant,
        'fooBinFunction',
        path.resolve(__dirname, '../../support/functions/fooBinFunction.js')
      )).run().pipe(toArray()).toPromise()).join('')).toEqual(
        `Some initial log
Some other log
`
      );
      expect(logHandler).toHaveBeenCalledWith(expect.stringContaining(
        'Some initial log'
      ));
      expect(logHandler).toHaveBeenCalledWith(expect.stringContaining(
        'Some other log'
      ));
      expect(errorHandler).toHaveBeenCalledWith(expect.stringContaining(
        'Some error log'
      ));
      logger._handlers.delete(logHandler);
      logger._errorHandlers.delete(errorHandler);
    });

    test('should fail if bin fails', () => {
      expect((new BinFunction(
        ant,
        'crashBinFunction',
        path.resolve(__dirname, '../../support/functions/crashBinFunction.js')
      )).run().toPromise()).rejects.toThrowError(
        'crashBinFunction bin function process closed with code "1"'
      );
    });

    test('should return undefined if bin returns nothing', async () => {
      expect(await (new BinFunction(
        ant,
        'binFunction',
        'sleep'
      )).run(['1']).toPromise()).toEqual(
        undefined
      );
    });

    test('should fail if bin crashes', async () => {
      expect.hasAssertions();
      const originalSpawn = childProcess.spawn;
      childProcess.spawn = jest.fn(() => { return {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Some server error'));
          }
        })
      };});
      try {
        await binFunction.run().toPromise();
      } catch(e) {
        expect(e.message).toEqual(
          expect.stringContaining(
            'fooFunction bin function process crashed'
          )
        );
      }
      childProcess.spawn = originalSpawn;
    });
  });
});
