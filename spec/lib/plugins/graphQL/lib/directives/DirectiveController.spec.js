/**
 * @fileoverview Tests for
 * lib/plugins/graphQL/lib/directives/DirectiveController.js file.
 */

const Ant = require('../../../../../../lib/Ant');
const AntFunction = require('../../../../../../lib/functions/AntFunction');
const Plugin = require('../../../../../../lib/plugins/Plugin');
const Directive = require(
  '../../../../../../lib/plugins/graphQL/lib/directives/Directive'
);
const DirectiveController = require(
  '../../../../../../lib/plugins/graphQL/lib/directives/DirectiveController'
);

const ant = new Ant();
const fooFunction = new AntFunction('fooFunction');
const fooDirective = new Directive(
  ant,
  'fooDirective',
  'fooDefinition',
  fooFunction
);
const directiveController = new DirectiveController(ant, [fooDirective]);

describe('lib/plugins/graphQL/lib/directives/DirectiveController.js', () => {
  test('should export "DirectiveController" class', () => {
    expect(directiveController.constructor.name).toEqual('DirectiveController');
  });

  test('should load plugins\' directives', () => {
    const antWithDirectives = new Ant();
    const fooDirective1 = new Directive(
      antWithDirectives,
      'fooDirective1',
      'fooDefinition1',
      new AntFunction('fooFunction1')
    );
    const fooDirective2 = new Directive(
      antWithDirectives,
      'fooDirective2',
      'fooDefinition2',
      new AntFunction('fooFunction2')
    );

    /**
     * Represents a {@link Plugin} without directives for testing purposes.
     * @extends Plugin
     * @private
     */
    class PluginWithoutDirectives extends Plugin {
      get directives() {
        throw new Error();
      }
    }

    /**
     * Represents a {@link Plugin} with directives for testing purposes.
     * @extends Plugin
     * @private
     */
    class PluginWithDirectives extends Plugin {
      get directives() {
        return [fooDirective1, fooDirective2];
      }
    }

    antWithDirectives.pluginController.loadPlugin(PluginWithoutDirectives);
    antWithDirectives.pluginController.loadPlugin(PluginWithDirectives);
    const controllerWithDirectives = new DirectiveController(antWithDirectives);

    expect(controllerWithDirectives._directives).toEqual(expect.any(Map));
    expect(controllerWithDirectives._directives.get('fooDirective1'))
      .toEqual(fooDirective1);
    expect(controllerWithDirectives._directives.get('fooDirective2'))
      .toEqual(fooDirective2);
  });

  test('should fail if "ant" param is not passed', () => {
    expect(() => new DirectiveController()).toThrowError(
      'Could not initialize the directive controller: param "ant" should be Ant'
    );
  });

  test('should fail if "ant" param is not Ant', () => {
    expect(() => new DirectiveController({})).toThrowError(
      'Could not initialize the directive controller: param "ant" should be Ant'
    );
  });

  test('should fail to load directives if not valid', () => {
    expect(() => new DirectiveController(ant, {})).toThrowError(
      'Could not load directives: param "directives" should be an array'
    );
    expect(() => new DirectiveController(ant, [{}])).toThrowError(
      'Directive "Object" should be an instance of Directive'
    );
    expect(() => new DirectiveController(
      ant,
      [new Directive(new Ant(), 'fooDirective', 'fooDefinition', fooFunction)]
    )).toThrowError(
      'The framework used to initialize the directive "fooDirective" is \
different of this controller\'s'
    );
  });

  test('should load directives', () => {
    expect(directiveController._directives.get('fooDirective'))
      .toEqual(fooDirective);
  });

  describe('DirectiveController.ant', () => {
    test('should be readonly', () => {
      expect(directiveController.ant).toEqual(ant);
      directiveController.ant = new Ant();
      expect(directiveController.ant).toEqual(ant);
    });
  });

  describe('DirectiveController.directives', () => {
    test('should be readonly', () => {
      expect(directiveController.directives).toEqual([fooDirective]);
      directiveController.directives = [];
      expect(directiveController.directives).toEqual([fooDirective]);
    });
  });

  describe('DirectiveController.loadDirectives', () => {
    test(
      'should load new directives and override existent ones with same name',
      () => {
        const newFooDirective = new Directive(
          ant,
          'fooDirective',
          'fooDefinition',
          fooFunction
        );
        const directiveController = new DirectiveController(
          ant,
          [fooDirective]
        );
        directiveController.loadDirectives([newFooDirective]);
        expect(directiveController.directives).toEqual([newFooDirective]);
      }
    );
  });

  describe('DirectiveController.getDirective', () => {
    test(
      'should return null if directive not found and find when existent',
      () => {
        expect(directiveController.getDirective('inexistentDirective')).toEqual(
          null
        );
        expect(directiveController.getDirective('fooDirective')).toEqual(
          fooDirective
        );
      });
  });
});
