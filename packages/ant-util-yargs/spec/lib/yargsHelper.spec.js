/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/yargsHelper.js file.
 */

const yargsHelper = require('../../lib/yargsHelper');
const yargs = require('yargs');

describe('lib/yargsHelper.js', () => {
  test('should export getCliFileName function', () => {
    const originalArgv = process.argv;
    process.argv = ['node'];
    expect(yargsHelper.getCliFileName).toEqual(expect.any(Function));
    expect(yargsHelper.getCliFileName()).toEqual('ant');
    process.argv.push('/path/to/ant.js');
    expect(yargsHelper.getCliFileName()).toEqual('ant.js');
    process.argv = originalArgv;
  });

  test('should export isVerboseMode function', () => {
    const originalArgv = process.argv;
    expect(yargsHelper.isVerboseMode).toEqual(expect.any(Function));
    expect(yargsHelper.isVerboseMode()).toBeFalsy();
    process.argv.push('--verbose');
    expect(yargsHelper.isVerboseMode()).toBeTruthy();
    process.argv = originalArgv;
    process.argv.push('-v');
    expect(yargsHelper.isVerboseMode()).toBeTruthy();
    process.argv = originalArgv;
  });

  test('should export handleErrorMessage function', (done) => {
    expect(yargsHelper.handleErrorMessage).toEqual(expect.any(Function));
    const originalError = console.error;
    console.error = jest.fn();
    const originalArgv = process.argv;
    process.argv.push('--verbose');
    const originalExit = process.exit;
    process.exit = jest.fn((code) => {
      expect(code).toEqual(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Some message')
      );
      process.exit = jest.fn((code) => {
        expect(code).toEqual(1);
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Some message')
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Error stack:')
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('--help someCommand')
        );
        console.error = originalError;
        process.argv = originalArgv;
        process.exit = originalExit;
        done();
      });
      const someError = new Error('Some message');
      yargsHelper.handleErrorMessage(
        someError.message,
        someError,
        'someCommand'
      );
    });
    yargsHelper.handleErrorMessage('Some message');
  });

  test('handleErrorMessage should exit the process without tracking the error', () => {
    const originalExit = process.exit;
    process.exit = jest.fn();
    const returnVal = yargsHelper.handleErrorMessage('Some message', null, '', true);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(returnVal).not.toBeInstanceOf(Promise);
    process.exit = originalExit;
  });

  test('handleErrorMessage should only log error if verbose', (done) => {
    expect(yargsHelper.handleErrorMessage).toEqual(expect.any(Function));
    const originalError = console.error;
    console.error = jest.fn();
    const originalArgv = process.argv;
    process.argv = [];
    const originalExit = process.exit;
    process.exit = jest.fn((code) => {
      expect(code).toEqual(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Some message')
      );
      process.exit = jest.fn((code) => {
        expect(code).toEqual(1);
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Some message')
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'For getting the error stack, use --verbose option'
          )
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('--help someCommand')
        );
        console.error = originalError;
        process.argv = originalArgv;
        process.exit = originalExit;
        done();
      });
      const someError = new Error('Some message');
      yargsHelper.handleErrorMessage(
        someError.message,
        someError,
        'someCommand'
      );
    });
    yargsHelper.handleErrorMessage('Some message');
  });

  describe('yargs', () => {
    describe('fail handler', () => {
      beforeEach(() => {
        yargs.resetOptions();
        yargsHelper._resetHandler();
      });

      afterAll(() => {
        yargs.resetOptions();
        yargsHelper._resetHandler();
      });

      test('should invoke attached fail handler', () => {
        const msg = 'mock error';
        const err = new Error('my error');
        const handler = jest.fn();
        yargsHelper.attachFailHandler(yargs, handler);
        const usage = yargs.getUsageInstance();
        usage.fail(msg, err);
        expect(handler).toHaveBeenCalledWith(msg, err, usage);
        expect(yargs._hasOutput()).toBe(false);
      });

      test('should do nothing because error was already handled', () => {
        yargsHelper.setErrorHandled();

        const handler = jest.fn();
        yargsHelper.attachFailHandler(yargs, handler);
        yargs.getUsageInstance().fail('mock error', new Error('my error'));
        expect(handler).not.toHaveBeenCalled();
      });

      test('should call yargs._setHasOutput when error is handled', () => {
        const msg = 'mock error';
        const err = new Error('my error');
        const handler = jest.fn().mockImplementation(() => {
          yargsHelper.setErrorHandled();
        });
        yargsHelper.attachFailHandler(yargs, handler);
        const usage = yargs.getUsageInstance();
        usage.fail(msg, err);
        expect(handler).toHaveBeenCalledWith(msg, err, usage);
        expect(yargs._hasOutput()).toBe(true);
      });
    });
  });

  describe('yargsHelper.executeCommand', () => {
    const originalExit = process.exit;

    beforeEach(() => {
      process.exit = jest.fn();
    });

    afterEach(() => {
      process.exit = originalExit;
    });

    test('should invoke callback and exit process with code 0', () => {
      const mockFn = jest.fn();
      yargsHelper.executeCommand('foo', async () => {
        mockFn();
      }).then(() => {
        expect(mockFn).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(0);
      });
    });

    test('should invoke callback and handle error thrown', () => {
      const error = new Error('Mocked error');
      yargsHelper.executeCommand('foo', async () => {
        throw error;
      }).then(() => {
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });
  });
});
