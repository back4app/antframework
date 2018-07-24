/**
 * @fileoverview Tests for lib/util/AntError.js file.
 */

const AntError = require('../../../lib/util/AntError');

describe('lib/util/AntError.js', () => {
  test('should export AntError class', () => {
    const antError = new AntError();
    expect(antError).toBeInstanceOf(Error);
    expect(antError.constructor.name).toEqual('AntError');
  });

  test('should show inner error stack in its own stack', () => {
    const innerError = new Error('Inner error');
    const outerError = new AntError('Outer error', innerError);
    expect(outerError.stack).toContain(innerError.stack);
  });
});
