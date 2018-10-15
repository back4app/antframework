/**
 * @fileoverview Tests for functions/subscribe.js file.
 */

const { AntError, logger } = require('@back4app/ant-util');
const rxjs = require('rxjs');
const subscribe = require('../../functions/subscribe');
const AsyncIterableObserver = require('../../lib/util/AsyncIterableObserver');

describe('functions/subscribe.js', () => {
  test('should export a function', () => {
    expect(typeof subscribe).toEqual('function');
  });

  test('should return null if subscribe args were not passed', async () => {
    expect(await subscribe(null, null, null)).toEqual(null);
  });

  test('should return null if resolver was not found', async () => {
    const ant = {
      functionController: {
        getFunction: jest.fn()
      }
    };
    const field = {
      fieldName: 'foo'
    };
    const directiveArgs = {
      to: 'fooFunc'
    };
    expect(await subscribe(ant, field, directiveArgs)).toEqual(null);
    expect(ant.functionController.getFunction).toHaveBeenCalledWith(directiveArgs.to);
  });

  test('should return an AsyncIterableObserver', async () => {
    const fieldArgs = ['foo', 'bar'];
    const ant = {
      functionController: {
        getFunction: jest.fn(() => {
          return {
            run: jest.fn(args => {
              expect(args).toEqual(fieldArgs);
              return rxjs.of(1);
            })
          };
        })
      }
    };
    const field = {
      fieldName: 'foo'
    };
    const directiveArgs = {
      to: 'fooFunc'
    };
    const asyncIterableObserver = await subscribe(ant, field, directiveArgs, fieldArgs);
    expect(asyncIterableObserver).toBeInstanceOf(AsyncIterableObserver);
    expect(asyncIterableObserver._fieldName).toBe('foo');
  });

  test('should return the AntFunction result', async () => {
    const mockedResult = {
      foo: 'bar'
    };
    const ant = {
      functionController: {
        getFunction: jest.fn(() => {
          return {
            run: jest.fn(() => {
              return mockedResult;
            })
          };
        })
      }
    };
    const field = {
      fieldName: 'foo'
    };
    const directiveArgs = {
      to: 'fooFunc'
    };
    expect(await subscribe(ant, field, directiveArgs)).toEqual(mockedResult);
  });

  test('should log the AntFunction execution error', async () => {
    const loggerMock = jest.spyOn(logger, 'error');
    const ant = {
      functionController: {
        getFunction: jest.fn(() => {
          return {
            run: jest.fn(() => {
              throw new Error('Mocked error');
            })
          };
        })
      }
    };
    const field = {
      fieldName: 'foo'
    };
    const directiveArgs = {
      to: 'fooFunc'
    };
    await subscribe(ant, field, directiveArgs);
    expect(loggerMock).toHaveBeenCalledWith(expect.any(AntError));
  });
});
