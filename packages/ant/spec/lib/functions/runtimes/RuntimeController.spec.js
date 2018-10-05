/**
 * @fileoverview Tests for lib/functions/runtimes/RuntimeController.js file.
 */

const Ant = require('../../../../lib/Ant');
const Plugin = require('../../../../lib/plugins/Plugin');
const Runtime = require('../../../../lib/functions/runtimes/Runtime');
const RuntimeController = require(
  '../../../../lib/functions/runtimes/RuntimeController'
);

const ant = new Ant();
const runtimeController = new RuntimeController(ant);

describe('lib/functions/runtimes/RuntimeController.js', () => {
  test('should export "RuntimeController" class', () => {
    expect(runtimeController.constructor.name).toEqual('RuntimeController');
  });

  test('should load plugins\' runtimes', () => {
    const antWithRuntimes = new Ant();

    const runtime1 = new Runtime(antWithRuntimes, 'runtime1', '/foo/bin');
    const runtime2 = new Runtime(antWithRuntimes, 'runtime2', '/foo/bin');
    const runtime2v2 = new Runtime(antWithRuntimes, 'runtime2', '/foo/bin');

    /**
     * Represents a {@link Plugin} with runtimes for testing purposes.
     * @extends Plugin
     * @private
     */
    class PluginWithRuntimes extends Plugin {
      get runtimes() {
        return [runtime1, runtime2, runtime2v2];
      }
    }

    antWithRuntimes.pluginController.loadPlugins([PluginWithRuntimes]);
    expect(antWithRuntimes.runtimeController.runtimes)
      .toEqual(expect.any(Array));
    expect(
      antWithRuntimes.runtimeController.runtimes[0].name
    ).toEqual('Node');
    expect(
      antWithRuntimes.runtimeController.runtimes[1]
    ).toEqual(runtime1);
    expect(
      antWithRuntimes.runtimeController.runtimes[2]
    ).toEqual(runtime2v2);
  });

  test('should fail if "ant" param is not passed', () => {
    expect(() => new RuntimeController()).toThrowError(
      'Could not initialize the runtime controller: param "ant" is required'
    );
  });

  test('should fail if "ant" param is not Ant', () => {
    expect(() => new RuntimeController({})).toThrowError(
      'Could not initialize the runtime controller: param "ant" \
should be Ant'
    );
  });

  test('should fail to load runtimes due to invalid param type', () => {
    expect(() => new RuntimeController(
      ant,
      'invalid_runtime_config'
    )).toThrowError(
      'Could not load runtimes: param "runtimes" should be Array'
    );
    expect(() => new RuntimeController(
      ant,
      [() => {}]
    )).toThrowError(
      'should be an instance of Runtime'
    );
  });

  test('should load runtimes', () => {
    const myCustomRuntime = new Runtime(
      ant,
      'myCustomRuntime',
      '/foo/bin',
      ['extension'],
      '/foo/template'
    );
    const runtimes = [myCustomRuntime];
    const runtimeController = new RuntimeController(ant, runtimes);
    const loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name);
    expect(loadedRuntime).toEqual(myCustomRuntime);
    expect(loadedRuntime.template).toEqual('/foo/template');
  });

  describe('RuntimeController.ant', () => {
    test('should be readonly', () => {
      expect(runtimeController.ant).toEqual(ant);
      runtimeController.ant = new Ant();
      expect(runtimeController.ant).toEqual(ant);
    });
  });

  describe('RuntimeController.getRuntime', () => {
    test('should return null if runtime list is empty', () => {
      const runtimeController = new RuntimeController(ant);
      expect(runtimeController.getRuntime('any runtime'))
        .toEqual(null);
    });

    test('should return null if runtime was not found', () => {
      const runtimes = [
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin', ['extension'], '/foo/template', '1.0.0'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin2', ['extension'], null, '0.0.1'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin3', ['extension'], null, '2.0.1'
        )
      ];
      const runtimeController = new RuntimeController(ant, runtimes);
      expect(runtimeController.getRuntime('foo')).toBeNull();
    });

    test('should fail due to invalid version param', () => {
      try {
        runtimeController.getRuntime('name', 1.2);
      } catch (err) {
        expect(err.message).toBe('Could not get runtime. "version" \
should be non-empty String');
      }
    });

    test('should return the default runtime', () => {
      const myCustomRuntime = new Runtime(
        ant,
        'myCustomRuntime',
        '/foo/bin',
        ['extension'],
        '/foo/template',
        '1.0.0'
      );
      const runtimes = [
        myCustomRuntime,
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin2', ['extension'], null, '0.0.1'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin3', ['extension'], null, '2.0.1'
        )
      ];
      const runtimeController = new RuntimeController(ant, runtimes);
      const loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name);
      expect(loadedRuntime).toEqual(myCustomRuntime);
    });

    test('should return given a version', () => {
      const myCustomRuntime = new Runtime(
        ant,
        'myCustomRuntime',
        '/foo/bin',
        ['extension'],
        '/foo/template',
        '1.0'
      );
      const runtimes = [
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin2', ['extension'], null, '1.2'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin3', ['extension'], null, '2.0.1'
        ),
        myCustomRuntime
      ];
      const runtimeController = new RuntimeController(ant, runtimes);
      const loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name, '1.1');
      expect(loadedRuntime).toEqual(myCustomRuntime);
    });

    test('should return given a version and max version constraint', () => {
      const myCustomRuntime = new Runtime(
        ant,
        'myCustomRuntime',
        '/foo/bin',
        ['extension'],
        '/foo/template',
        '1.0.0',
        '1.0.2'
      );
      const runtimes = [myCustomRuntime];
      const runtimeController = new RuntimeController(ant, runtimes);
      const loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name, '1.0.1');
      expect(loadedRuntime).toEqual(myCustomRuntime);
    });

    test('should return null due to version out of range', () => {
      const runtimes = [
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin1', ['extension'], null, '1.1', '2.0'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin2', ['extension'], null, '2.1', '3.0'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin3', ['extension'], null, '2.0.2', '4.0.0'
        )
      ];
      const runtimeController = new RuntimeController(ant, runtimes);
      const loadedRuntime = runtimeController.getRuntime('myCustomRuntime', '2.0.1');
      expect(loadedRuntime).toBeNull();
    });
  });
});
