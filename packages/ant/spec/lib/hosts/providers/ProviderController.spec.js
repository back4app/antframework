/**
 * @fileoverview Tests for lib/hosts/providers/ProviderController.js file.
 */

const Ant = require('../../../../lib/Ant');
const Plugin = require('../../../../lib/plugins/Plugin');
const Provider = require('../../../../lib/hosts/providers/Provider');
const ProviderController = require(
  '../../../../lib/hosts/providers/ProviderController'
);

const ant = new Ant();
const providerController = new ProviderController(ant);

describe('lib/hosts/providers/ProviderController.js', () => {
  test('should export "ProviderController" class', () => {
    expect(providerController.constructor.name).toEqual('ProviderController');
  });

  test('should load plugins\' providers', () => {
    const antWithProviders = new Ant();

    const provider1 = new Provider('provider1');
    const provider2 = new Provider('provider2');
    const provider2v2 = new Provider('provider2');

    /**
     * Represents a {@link Plugin} with providers for testing purposes.
     * @extends Plugin
     * @private
     */
    class PluginWithProviders extends Plugin {
      get providers() {
        return [provider1, provider2, provider2v2];
      }
    }

    antWithProviders.pluginController.loadPlugins([PluginWithProviders]);
    expect(antWithProviders.providerController.providers)
      .toEqual(expect.any(Array));
    expect(
      antWithProviders.providerController.providers[0]
    ).toEqual(provider1);
    expect(
      antWithProviders.providerController.providers[1]
    ).toEqual(provider2v2);
  });

  test('should fail if "ant" param is not passed', () => {
    expect(() => new ProviderController()).toThrowError(
      'Could not initialize the provider controller: param "ant" is required'
    );
  });

  test('should fail if "ant" param is not Ant', () => {
    expect(() => new ProviderController({})).toThrowError(
      'Could not initialize the provider controller: param "ant" \
should be Ant'
    );
  });

  test('should fail to load providers due to invalid param type', () => {
    expect(() => new ProviderController(
      ant,
      'invalid_runtime_config'
    )).toThrowError(
      'Could not load providers: param "providers" should be Array'
    );
    expect(() => new ProviderController(
      ant,
      [() => {}]
    )).toThrowError(
      'should be an instance of Provider'
    );
  });

  test('should load providers', () => {
    const myCustomProvider = new Provider('myCustomProvider');
    const providers = [myCustomProvider];
    const providerController = new ProviderController(ant, providers);
    expect(() => providerController.getFunction(
      myCustomProvider.name).toEqual(myCustomProvider));
  });

  describe('ProviderController.ant', () => {
    test('should be readonly', () => {
      expect(providerController.ant).toEqual(ant);
      providerController.ant = new Ant();
      expect(providerController.ant).toEqual(ant);
    });
  });

  describe('ProviderController.getProvider', () => {
    test('should return null if provider not found', () => {
      expect(providerController.getProvider('NotExistent'))
        .toEqual(null);
    });
  });
});
