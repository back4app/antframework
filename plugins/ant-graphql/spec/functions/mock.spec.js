/**
 * @fileoverview Tests for functions/mock.js file.
 */

const Mustache = require('mustache');
const { AntError, logger } = require('@back4app/ant-util');
const mock = require('../../functions/mock');

describe('functions/mock.js', () => {
  test('should export a function', () => {
    expect(typeof mock).toEqual('function');
  });

  test('should return currentValue if not undefined', () => {
    expect(mock(null, null, null, 'fooValue')).toEqual('fooValue');
  });

  test('should return null if mock args were not passed', () => {
    expect(mock(null, null)).toEqual(null);
  });

  test('should return with if field args were not passed', () => {
    expect(mock(null, { with: 'fooValue' })).toEqual('fooValue');
  });

  test('should use mustache to render with param', () => {
    expect(mock(null, { with: '{{fooData}}' }, { fooData: 'fooValue' }))
      .toEqual('fooValue');
  });

  test('should log error if mustache fails', () => {
    const error = jest.fn();
    logger.attachErrorHandler(error);
    const originalRender = Mustache.render;
    Mustache.render = () => { throw new Error('Some render error'); };
    expect(mock(null, { with: '{{fooData}}' }, { fooData: 'fooValue' }))
      .toEqual(null);
    expect(error).toHaveBeenCalledWith(expect.any(
      AntError
    ));
    Mustache.render = originalRender;
    logger._errorHandlers.delete(error);
  });
});
