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
    const runtime1 = new Runtime(antWithRuntimes, 'runtime1', '/foo/bin', [], undefined, '1');
    const runtime2 = new Runtime(antWithRuntimes, 'runtime2', '/foo/bin', [], undefined, '2');
    const runtime2v2 = new Runtime(antWithRuntimes, 'runtime2', '/foo/bin', [], undefined, '3');

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
    const { runtimes } = antWithRuntimes.runtimeController;
    expect(runtimes).toEqual(expect.any(Map));
    expect(runtimes.get('Node').get('default')).toBeDefined();
    expect(runtimes.get('runtime1').get('default')).toEqual(runtime1);
    expect(runtimes.get('runtime2').get('default')).toEqual(runtime2);
    expect(runtimes.get('runtime2').get('3')).toEqual(runtime2v2);
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
      '/foo/template',
      '1'
    );
    const runtimes = [myCustomRuntime];
    const runtimeController = new RuntimeController(ant, runtimes);
    const loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name);
    expect(loadedRuntime).toEqual(myCustomRuntime);
    expect(loadedRuntime.template).toEqual('/foo/template');
  });

  test('should load runtimes and set a new default', () => {
    const myCustomRuntime = new Runtime(
      ant,
      'myCustomRuntime',
      '/foo/bin',
      ['extension'],
      '/foo/template',
      '1'
    );
    const myNewDefault = new Runtime(
      ant,
      'myCustomRuntime',
      '/bar/bin',
      ['newextension'],
      '/bar/template',
      '1',
      true
    );
    const runtimes = [myCustomRuntime];
    const runtimeController = new RuntimeController(ant, runtimes);
    let loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name);
    expect(loadedRuntime).toEqual(myCustomRuntime);

    runtimeController.loadRuntimes([myNewDefault]);
    loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name);
    expect(loadedRuntime).toEqual(myNewDefault);
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
      const runtimes = [ myCustomRuntime ];
      const runtimeController = new RuntimeController(ant, runtimes);
      const loadedRuntime = runtimeController.getRuntime(myCustomRuntime.name, '1');
      expect(loadedRuntime).toEqual(myCustomRuntime);
    });

    test('should return null due to version out of range', () => {
      const runtimes = [
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin1', ['extension'], null, '1.1'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin2', ['extension'], null, '2.1'
        ),
        new Runtime(
          ant, 'myCustomRuntime', '/foo/bin3', ['extension'], null, '3.0.2'
        )
      ];
      const runtimeController = new RuntimeController(ant, runtimes);
      const loadedRuntime = runtimeController.getRuntime('myCustomRuntime', '4');
      expect(loadedRuntime).toBeNull();
    });
  });
});
