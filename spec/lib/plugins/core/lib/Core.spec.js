/**
 * @fileoverview Tests for lib/plugins/core/lib/Core.js file.
 */

const Plugin = require('../../../../../lib/plugins/Plugin');

describe('lib/plugins/core/lib/Core.js', () => {
  test('should export "Core" class extending "Plugin" class', () => {
    const Core = require('../../../../../lib/plugins/core/lib/Core');
    const core = new Core();
    expect(core.constructor.name).toEqual('Core');
    expect(core).toBeInstanceOf(Plugin);
    expect(core.name).toEqual('Core');
  });
});
