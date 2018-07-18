/**
 * @fileoverview Tests for lib/util/logger.js file.
 */

const logger = require('../../../lib/util/logger');

describe('lib/util/logger.js', () => {
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
});
