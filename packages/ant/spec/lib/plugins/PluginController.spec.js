/**
 * @fileoverview Tests for lib/plugins/PluginController.js file.
 */

const assert = require('assert');
const { AssertionError } = assert;
const path = require('path');
const yargs = require('yargs');
const { Observable } = require('rxjs');
const Core = require('@back4app/ant-core');
const Ant = require('../../../lib/Ant');
const Plugin = require('../../../lib/plugins/Plugin');
const PluginController = require('../../../lib/plugins/PluginController');
const Template = require('../../../lib/templates/Template');
const AntFunction = require('../../../lib/functions/AntFunction');
const Runtime = require('../../../lib/functions/runtimes/Runtime');
const Provider = require('../../../lib/hosts/providers/Provider');
const FooPlugin = require('@back4app/ant-util-tests/plugins/FooPlugin');
const NotAPlugin = require('@back4app/ant-util-tests/plugins/NotAPlugin');


const ant = new Ant();
const plugin = new Plugin(ant);
const corePluginPath = path.resolve(
  __dirname,
  '../../../node_modules/@back4app/ant-core'
);
const fooPluginPath = path.resolve(
  __dirname,
  '../../../node_modules/@back4app/ant-util-tests/plugins/FooPlugin'
);
const notAPluginPath = path.resolve(
  __dirname,
  '../../../node_modules/@back4app/ant-util-tests/plugins/NotAPlugin'
);

/**
 * Represents a fake {@link Plugin} class for testing purposes.
 * @extends Plugin
 * @private
 */
class MyPlugin extends Plugin {}

/**
 * Represents a fake {@link Plugin} class for testing purposes.
 * @extends FooPlugin
 * @private
 */
class MyOtherPlugin extends FooPlugin {}

/**
 * Represents a {@link Plugin} that overrides the "name" member and throws an
 * Error for testing purposes.
 * @private
 */
class NameErrorPlugin extends Plugin {
  get name() {
    throw new Error('Some name error');
  }
}

const nameErrorPlugin = new NameErrorPlugin(ant);

/**
 * Represents a {@link Plugin} that overrides the base constructor and throws an
 * Error for testing purposes.
 * @private
 */
class InitializationErrorPlugin extends Plugin {
  constructor(ant) {
    super(ant);

    throw new Error('Some initialization error');
  }
}

/**
 * Represents a {@link Plugin} that overrides the "loadYargsSettings" method and
 * throws an Error for testing purposes.
 * @private
 */
class YargsErrorPlugin extends NameErrorPlugin {
  loadYargsSettings() {
    throw new Error('Some yargs error');
  }
}

const yargsErrorPlugin = new YargsErrorPlugin(ant);

const template1 = new Template('Category1', 'Template1', 'Path1');
const template2 = new Template('Category2', 'Template2', 'Path2');

/**
 * Represents a {@link Plugin} with templates for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithTemplates extends Plugin {
  get templates() {
    return [template1, template2];
  }
}

/**
 * Represents a {@link Plugin} that overrides the "templates" member and
 * throws an Error for testing purposes.
 * @private
 */
class TemplatesErrorPlugin extends NameErrorPlugin {
  get templates() {
    throw new Error('Some templates error');
  }
}

/**
 * Represents a {@link Plugin} with a not valid template for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithNotValidTemplate extends Plugin {
  get templates() {
    return [template1, {}, template2];
  }
}

const function1 = new AntFunction(ant, 'function1');
const function2 = new AntFunction(ant, 'function2');

/**
 * Represents a {@link Plugin} with functions for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithFunctions extends Plugin {
  get functions() {
    return [function1, function2];
  }
}

/**
 * Represents a {@link Plugin} that overrides the "functions" member and
 * throws an Error for testing purposes.
 * @private
 */
class FunctionsErrorPlugin extends NameErrorPlugin {
  get functions() {
    throw new Error('Some functions error');
  }
}

/**
 * Represents a {@link Plugin} with a not valid function for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithNotValidFunction extends Plugin {
  get functions() {
    return [function1, {}, function2];
  }
}

const runtime1 = new Runtime(ant, 'runtime1', '/foo/path');
const runtime2 = new Runtime(ant, 'runtime2', '/foo/path');

/**
 * Represents a {@link Plugin} with runtimes for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithRuntimes extends Plugin {
  get runtimes() {
    return [runtime1, runtime2];
  }
}

/**
 * Represents a {@link Plugin} that overrides the "runtimes" member and
 * throws an Error for testing purposes.
 * @private
 */
class RuntimesErrorPlugin extends NameErrorPlugin {
  get runtimes() {
    throw new Error('Some runtimes error');
  }
}

/**
 * Represents a {@link Plugin} with a not valid runtime for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithNotValidRuntime extends Plugin {
  get runtimes() {
    return [runtime1, {}, runtime2];
  }
}

const provider1 = new Provider('provider1');
const provider2 = new Provider('provider2');

/**
 * Represents a {@link Plugin} with providers for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithProviders extends Plugin {
  get providers() {
    return [provider1, provider2];
  }
}

/**
 * Represents a {@link Plugin} that overrides the "providers" member and
 * throws an Error for testing purposes.
 * @private
 */
class ProvidersErrorPlugin extends NameErrorPlugin {
  get providers() {
    throw new Error('Some providers error');
  }
}

/**
 * Represents a {@link Plugin} with a not valid provider for testing purposes.
 * @extends Plugin
 * @private
 */
class PluginWithNotValidProvider extends Plugin {
  get providers() {
    return [provider1, {}, provider2];
  }
}

describe('lib/plugins/PluginController.js', () => {
  test('should export "PluginController" class', () => {
    const pluginController = new PluginController(ant);

    expect(pluginController.constructor.name).toEqual('PluginController');
  });

  test('should fail if the ant instance is not passed', () => {
    expect(() => new PluginController()).toThrowError(
      'Could not initialize the plugin controller: param "ant" is required'
    );
  });

  test('should fail if the ant param is not an Ant', () => {
    expect(() => new PluginController({})).toThrowError(
      'Could not initialize the plugin controller: param "ant" should be Ant'
    );
  });

  test('should initialize with no plugins and without errors', () => {
    const pluginController = new PluginController(ant);

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(0);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(0);
  });

  test('should initialize with plugin array and without errors', () => {
    const pluginController = new PluginController(ant, [
      corePluginPath,
      [fooPluginPath, { a: 1, b: 2, c: 3}],
      MyPlugin,
      [MyOtherPlugin, { a: 4, b: 5, c: 6}],
      plugin
    ]);

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(5);
    expect(pluginController.plugins[0]).toBeInstanceOf(Core);
    expect(pluginController.plugins[1]).toBeInstanceOf(FooPlugin);
    expect(pluginController.plugins[1].a).toEqual(1);
    expect(pluginController.plugins[1].b).toEqual(2);
    expect(pluginController.plugins[1].c).toEqual(3);
    expect(pluginController.plugins[2]).toBeInstanceOf(MyPlugin);
    expect(pluginController.plugins[3]).toBeInstanceOf(MyOtherPlugin);
    expect(pluginController.plugins[3].a).toEqual(4);
    expect(pluginController.plugins[3].b).toEqual(5);
    expect(pluginController.plugins[3].c).toEqual(6);
    expect(pluginController.plugins[4]).toEqual(plugin);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(0);
  });

  test('should fail if the passed "plugins" param is not an array', () => {
    expect(() => new PluginController(ant, {})).toThrowError(
      'Could not load plugins: param "plugins" should be Array'
    );
  });

  test('should not load plugin if it does not resolve', () => {
    const pluginController = new PluginController(ant, [
      corePluginPath,
      [fooPluginPath, { a: 1, b: 2, c: 3}],
      plugin,
      'InexistentFooPlugin',
      notAPluginPath,
      {}
    ]);

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(3);
    expect(pluginController.plugins[0]).toBeInstanceOf(Core);
    expect(pluginController.plugins[1]).toBeInstanceOf(FooPlugin);
    expect(pluginController.plugins[1].a).toEqual(1);
    expect(pluginController.plugins[1].b).toEqual(2);
    expect(pluginController.plugins[1].c).toEqual(3);
    expect(pluginController.plugins[2]).toEqual(plugin);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(3);
    expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[0].message)
      .toEqual(expect.stringContaining('InexistentFooPlugin'));
    expect(pluginController.loadingErrors[1]).toBeInstanceOf(AssertionError);
    expect(pluginController.loadingErrors[1].message)
      .toEqual(expect.stringContaining('NotAPlugin'));
    expect(pluginController.loadingErrors[2]).toBeInstanceOf(AssertionError);
    expect(pluginController.loadingErrors[2].message)
      .toEqual(expect.stringContaining(
        'Could not load plugin: param "plugin" should be String or Plugin'
      ));
  });

  test(
    'should load plugin which name member throws Error with default name and \
    loading error',
    () => {
      const pluginController = new PluginController(ant, [nameErrorPlugin]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      expect(pluginController.plugins[0]).toEqual(nameErrorPlugin);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
    }
  );

  test('should use second load if plugin is loaded twice', () => {
    const fooPlugin = new FooPlugin(ant);
    const pluginController = new PluginController(ant, [
      fooPluginPath,
      fooPlugin
    ]);
    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(1);
    expect(pluginController.plugins[0]).toEqual(fooPlugin);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(0);
  });

  test('should not load plugin with initialization error', () => {
    const pluginController = new PluginController(
      ant,
      [InitializationErrorPlugin, NotAPlugin]
    );
    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(0);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(2);
    expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[0].message)
      .toEqual(expect.stringContaining('Some initialization error'));
    expect(pluginController.loadingErrors[1]).toBeInstanceOf(AssertionError);
    expect(pluginController.loadingErrors[1].message)
      .toEqual(expect.stringContaining('it should be Plugin'));
  });

  test('should not load plugin initialized with another ant instance', () => {
    const pluginController = new PluginController(
      ant,
      [new Plugin(new Ant())]
    );
    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(0);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(1);
    expect(pluginController.loadingErrors[0]).toBeInstanceOf(AssertionError);
    expect(pluginController.loadingErrors[0].message)
      .toEqual(expect.stringContaining(
        'Could not load plugin: the framework used to initialize the plugin is \
different to this controller\'s'
      ));
  });

  describe('PluginController.ant', () => {
    test('should be readonly', () => {
      const pluginController = new PluginController(ant);
      expect(pluginController.ant).toEqual(ant);
      pluginController.ant = new Ant();
      expect(pluginController.ant).toEqual(ant);
    });
  });

  describe('PluginController.plugins', () => {
    test('should be readonly', () => {
      const pluginController = new PluginController(ant, [
        fooPluginPath,
        new FooPlugin(ant)
      ]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      expect(pluginController.plugins[0]).toBeInstanceOf(FooPlugin);
      pluginController.plugins = [];
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      expect(pluginController.plugins[0]).toBeInstanceOf(FooPlugin);
    });
  });

  describe('PluginController.pluginsObservable', () => {
    test('should be readonly and return observable', () => {
      const fooPlugin = new FooPlugin(ant);
      const pluginController = new PluginController(ant, [
        './spec/support/plugins/FooPlugin',
        fooPlugin
      ]);
      expect(pluginController.pluginsObservable).toEqual(
        expect.any(Observable)
      );
      pluginController.pluginsObservable = {};
      expect(pluginController.pluginsObservable).toEqual(
        expect.any(Observable)
      );
      const next = jest.fn();
      const subscription = pluginController.pluginsObservable.subscribe(next);
      expect(next).toHaveBeenCalledWith(fooPlugin);
      subscription.unsubscribe();
      const plugin = new Plugin(ant);
      pluginController.loadPlugins([plugin]);
      expect(next).not.toHaveBeenCalledWith(plugin);
    });
  });

  describe('PluginController.loadingErrors', () => {
    test('should be readonly', () => {
      const pluginController = new PluginController(ant, [
        fooPluginPath,
        new NotAPlugin()
      ]);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(AssertionError);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining(
          'Could not load plugin: param "plugin" should be String or Plugin'
        ));
      pluginController.loadingErrors = [];
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(AssertionError);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining(
          'Could not load plugin: param "plugin" should be String or Plugin'
        ));
    });
  });

  describe('PluginController.getPlugin', () => {
    test('should return the plugin by its name', () => {
      const plugin = new Plugin(ant);
      const pluginController = new PluginController(ant, [plugin]);
      expect(pluginController.getPlugin('Plugin')).toEqual(plugin);
    });
  });

  describe('PluginController.getFromPlugin', () => {
    const plugin = new Plugin(ant);
    plugin.fooMember = 'Foo Value';
    const pluginController = (new PluginController(ant, [plugin]));

    test('should return the plugin memnber value', () => {
      expect(pluginController.getFromPlugin(
        plugin,
        'fooMember',
        (value) => assert(value === 'Foo Value')
      )).toEqual('Foo Value');
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(0);
    });

    test('should fail if params are not valid', () => {
      expect(() => pluginController.getFromPlugin()).toThrowError(
        'Could not get from plugin: param "plugin" should be Plugin'
      );
      expect(() => pluginController.getFromPlugin({})).toThrowError(
        'Could not get from plugin: param "plugin" should be Plugin'
      );
      expect(() => pluginController.getFromPlugin(plugin)).toThrowError(
        'Could not get from plugin: param "member" should be String'
      );
      expect(() => pluginController.getFromPlugin(plugin, {})).toThrowError(
        'Could not get from plugin: param "member" should be String'
      );
      expect(() => pluginController.getFromPlugin(
        plugin,
        'fooMember',
        {})
      ).toThrowError(
        'Could not get from plugin: param "assertionFunction" should be \
Function'
      );
    });

    test('should use assertion function to validate the output', () => {
      const pluginController = (new PluginController(ant, [plugin]));
      expect(pluginController.getFromPlugin(
        plugin,
        'fooMember',
        (value) => assert(value !== 'Foo Value')
      )).toEqual(null);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining(
          'Could not get "fooMember" from plugin "Plugin"'
        ));
    });

    test('should work without assertion function', () => {
      expect(pluginController.getFromPlugin(
        plugin,
        'fooMember'
      )).toEqual('Foo Value');
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(0);
    });
  });

  describe('PluginController.getPluginName', () => {
    test('should return the plugin name', () => {
      const pluginController = new PluginController(ant, [plugin]);
      expect(pluginController.getPluginName(plugin)).toEqual(plugin.name);
    });

    test('should return the default name in the case of error', () => {
      const pluginController = new PluginController(ant);
      expect(pluginController.getPluginName(nameErrorPlugin)).toEqual(
        Plugin.GetPluginDefaultName(nameErrorPlugin)
      );
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController(ant);
      expect(() => pluginController.getPluginName({})).toThrowError(
        'Could not get plugin name: param "plugin" should be Plugin'
      );
    });
  });

  describe('PluginController.getPluginTemplates', () => {
    test('should return the plugin\'s templates', () => {
      const pluginController = new PluginController(ant, [PluginWithTemplates]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      const pluginTemplates = pluginController.getPluginTemplates(
        pluginController.plugins[0]
      );
      expect(pluginTemplates).toEqual(expect.any(Array));
      expect(pluginTemplates).toHaveLength(2);
      expect(pluginTemplates[0]).toEqual(template1);
      expect(pluginTemplates[1]).toEqual(template2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(0);
    });

    test('should store loading error in the case of error', () => {
      const pluginController = new PluginController(
        ant, [PluginWithTemplates, TemplatesErrorPlugin]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithTemplates));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(TemplatesErrorPlugin));
      expect(pluginController.getPluginTemplates(pluginController.plugins[1]))
        .toEqual([]);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(3);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
      expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[1].message)
        .toEqual(expect.stringContaining('ould not get plugin name'));
      expect(pluginController.loadingErrors[2]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[2].message)
        .toEqual(expect.stringContaining('Could not get "TemplatesErrorPlugin" \
plugin templates'));
    });

    test('should store loading error if contains a not valid Template', () => {
      const pluginController = new PluginController(
        ant, [PluginWithTemplates, PluginWithNotValidTemplate]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithTemplates));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(PluginWithNotValidTemplate));
      const pluginTemplates = pluginController.getPluginTemplates(
        pluginController.plugins[1]
      );
      expect(pluginTemplates).toEqual(expect.any(Array));
      expect(pluginTemplates).toHaveLength(2);
      expect(pluginTemplates[0]).toEqual(template1);
      expect(pluginTemplates[1]).toEqual(template2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('it is not a Template'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController(ant);
      expect(() => pluginController.getPluginTemplates({})).toThrowError(
        'Could not get plugin templates: param "plugin" should be Plugin'
      );
    });
  });

  describe('PluginController.getPluginFunctions', () => {
    test('should return the plugin\'s functions', () => {
      const pluginController = new PluginController(ant, [PluginWithFunctions]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      const pluginFunctions = pluginController.getPluginFunctions(
        pluginController.plugins[0]
      );
      expect(pluginFunctions).toEqual(expect.any(Array));
      expect(pluginFunctions).toHaveLength(2);
      expect(pluginFunctions[0]).toEqual(function1);
      expect(pluginFunctions[1]).toEqual(function2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(0);
    });

    test('should store loading error in the case of error', () => {
      const pluginController = new PluginController(
        ant, [PluginWithFunctions, FunctionsErrorPlugin]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithFunctions));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(FunctionsErrorPlugin));
      expect(pluginController.getPluginFunctions(pluginController.plugins[1]))
        .toEqual([]);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(3);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
      expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[1].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
      expect(pluginController.loadingErrors[2]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[2].message)
        .toEqual(expect.stringContaining('Could not get "FunctionsErrorPlugin" \
plugin functions'));
    });

    test('should store loading error if contains a not valid Function', () => {
      const pluginController = new PluginController(
        ant, [PluginWithFunctions, PluginWithNotValidFunction]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithFunctions));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(PluginWithNotValidFunction));
      const pluginFunctions = pluginController.getPluginFunctions(
        pluginController.plugins[1]
      );
      expect(pluginFunctions).toEqual(expect.any(Array));
      expect(pluginFunctions).toHaveLength(2);
      expect(pluginFunctions[0]).toEqual(function1);
      expect(pluginFunctions[1]).toEqual(function2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('it is not a Function'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController(ant);
      expect(() => pluginController.getPluginFunctions({})).toThrowError(
        'Could not get plugin functions: param "plugin" should be Plugin'
      );
    });
  });

  describe('PluginController.getPluginRuntimes', () => {
    test('should return the plugin\'s runtimes', () => {
      const pluginController = new PluginController(ant, [PluginWithRuntimes]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      const pluginRuntimes = pluginController.getPluginRuntimes(
        pluginController.plugins[0]
      );
      expect(pluginRuntimes).toEqual(expect.any(Array));
      expect(pluginRuntimes).toHaveLength(2);
      expect(pluginRuntimes[0]).toEqual(runtime1);
      expect(pluginRuntimes[1]).toEqual(runtime2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(0);
    });

    test('should store loading error in the case of error', () => {
      const pluginController = new PluginController(
        ant, [PluginWithRuntimes, RuntimesErrorPlugin]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithRuntimes));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(RuntimesErrorPlugin));
      expect(pluginController.getPluginRuntimes(pluginController.plugins[1]))
        .toEqual([]);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(3);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
      expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[1].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
      expect(pluginController.loadingErrors[2]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[2].message)
        .toEqual(expect.stringContaining('Could not get "RuntimesErrorPlugin" \
plugin runtimes'));
    });

    test('should store loading error if contains a not valid runtime', () => {
      const pluginController = new PluginController(
        ant, [PluginWithRuntimes, PluginWithNotValidRuntime]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithRuntimes));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(PluginWithNotValidRuntime));
      const pluginProviders = pluginController.getPluginRuntimes(
        pluginController.plugins[1]
      );
      expect(pluginProviders).toEqual(expect.any(Array));
      expect(pluginProviders).toHaveLength(2);
      expect(pluginProviders[0]).toEqual(runtime1);
      expect(pluginProviders[1]).toEqual(runtime2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('it is not a Runtime'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController(ant);
      expect(() => pluginController.getPluginProviders({})).toThrowError(
        'Could not get plugin providers: param "plugin" should be Plugin'
      );
    });
  });

  describe('PluginController.getPluginProviders', () => {
    test('should return the plugin\'s providers', () => {
      const pluginController = new PluginController(ant, [PluginWithProviders]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      const pluginProviders = pluginController.getPluginProviders(
        pluginController.plugins[0]
      );
      expect(pluginProviders).toEqual(expect.any(Array));
      expect(pluginProviders).toHaveLength(2);
      expect(pluginProviders[0]).toEqual(provider1);
      expect(pluginProviders[1]).toEqual(provider2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(0);
    });

    test('should store loading error in the case of error', () => {
      const pluginController = new PluginController(
        ant, [PluginWithProviders, ProvidersErrorPlugin]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithProviders));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(ProvidersErrorPlugin));
      expect(pluginController.getPluginProviders(pluginController.plugins[1]))
        .toEqual([]);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(3);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
      expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[1].message)
        .toEqual(expect.stringContaining('Could not get plugin name'));
      expect(pluginController.loadingErrors[2]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[2].message)
        .toEqual(expect.stringContaining('Could not get "ProvidersErrorPlugin" \
plugin providers'));
    });

    test('should store loading error if contains a not valid provider', () => {
      const pluginController = new PluginController(
        ant, [PluginWithProviders, PluginWithNotValidProvider]
      );
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(2);
      expect(pluginController.plugins[0])
        .toEqual(expect.any(PluginWithProviders));
      expect(pluginController.plugins[1])
        .toEqual(expect.any(PluginWithNotValidProvider));
      const pluginProviders = pluginController.getPluginProviders(
        pluginController.plugins[1]
      );
      expect(pluginProviders).toEqual(expect.any(Array));
      expect(pluginProviders).toHaveLength(2);
      expect(pluginProviders[0]).toEqual(provider1);
      expect(pluginProviders[1]).toEqual(provider2);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('it is not a Provider'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController(ant);
      expect(() => pluginController.getPluginProviders({})).toThrowError(
        'Could not get plugin providers: param "plugin" should be Plugin'
      );
    });
  });

  describe('PluginController.loadPluginYargsSettings', () => {
    test('should load plugin\'s yargs settings', () => {
      const plugin = new Plugin(ant);
      plugin.loadYargsSettings = jest.fn();
      (new PluginController(ant)).loadPluginYargsSettings(plugin, yargs);
      expect(plugin.loadYargsSettings).toHaveBeenCalledWith(yargs);
    });

    test('should store loading error in the case of error', () => {
      const pluginController = new PluginController(ant);
      pluginController.loadPluginYargsSettings(yargsErrorPlugin, yargs);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(2);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('ould not get plugin name'));
      expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[1].message)
        .toEqual(expect.stringContaining('Could not load "YargsErrorPlugin" \
plugin\'s Yargs settings'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController(ant);
      expect(() => pluginController.loadPluginYargsSettings({}, yargs))
        .toThrowError('Could not load plugin\'s Yargs settings: param "plugin" \
should be Plugin');
    });
  });
});
