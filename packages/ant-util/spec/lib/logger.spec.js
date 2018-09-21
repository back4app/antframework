/**
 * @fileoverview Tests for lib/logger.js file.
 */

const logger = require('../../lib/logger');

describe('lib/logger.js', () => {
  test('should export Logger instance', () => {
    expect(logger).toEqual(expect.any(Object));
    expect(logger.constructor.name).toEqual('Logger');
  });

  describe('Logger.attachHandler', () => {
    test('should attach a function as a handler', () => {
      const myHandler = () => {};
      logger.attachHandler(myHandler);
      expect(logger._handlers).toEqual(expect.any(Set));
      expect(logger._handlers.size).toEqual(1);
      expect(Array.from(logger._handlers.values())[0]).toEqual(myHandler);
      logger._handlers.delete(myHandler);
    });

    test('should fail if handler is not a function', () => {
      expect(() => logger.attachHandler({})).toThrowError(
        'Could not attach handler: param "handler" should be Function'
      );
    });
  });

  describe('Logger.log', () => {
    test('should log an entry by calling the handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      logger.attachHandler(handler1);
      logger.attachHandler(handler2);
      logger.log('Some entry');
      expect(handler1).toHaveBeenCalledWith('Some entry');
      expect(handler2).toHaveBeenCalledWith('Some entry');
      logger._handlers.delete(handler1);
      logger._handlers.delete(handler2);
    });
  });

  describe('Logger.attachErrorHandler', () => {
    test('should attach a function as an error handler', () => {
      const myHandler = () => {};
      logger.attachErrorHandler(myHandler);
      expect(logger._errorHandlers).toEqual(expect.any(Set));
      expect(logger._errorHandlers.size).toEqual(1);
      expect(Array.from(logger._errorHandlers.values())[0]).toEqual(myHandler);
      logger._errorHandlers.delete(myHandler);
    });

    test('should fail if error handler is not a function', () => {
      expect(() => logger.attachErrorHandler({})).toThrowError(
        'Could not attach error handler: param "errorHandler" should be \
Function'
      );
    });
  });

  describe('Logger.error', () => {
    test('should log an error entry by calling the handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      logger.attachErrorHandler(handler1);
      logger.attachErrorHandler(handler2);
      logger.error('Some error entry');
      expect(handler1).toHaveBeenCalledWith('Some error entry');
      expect(handler2).toHaveBeenCalledWith('Some error entry');
      logger._errorHandlers.delete(handler1);
      logger._errorHandlers.delete(handler2);
    });
  });
});
