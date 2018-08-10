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

/**
 * Represents a {@link Directive} that overrides the "name" member and throws an
 * Error for testing purposes.
 * @private
 */
class NameErrorDirective extends Directive {
  get name() {
    throw new Error('Some name error');
  }
}

const nameErrorDirective = new NameErrorDirective(
  ant,
  'fooDirective',
  'fooDefinition',
  fooFunction
);

/**
 * Represents a {@link Directive} that overrides the "definition" member and
 * throws an Error for testing purposes.
 * @private
 */
class DefinitionErrorDirective extends Directive {
  get definition() {
    throw new Error('Some definition error');
  }
}

const definitionErrorDirective = new DefinitionErrorDirective(
  ant,
  'fooDirective',
  'fooDefinition',
  fooFunction
);

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

  describe('DirectiveController.getDirectiveName', () => {
    test('should return the directive name', () => {
      const directiveController = new DirectiveController(ant);
      expect(directiveController.getDirectiveName(fooDirective))
        .toEqual(fooDirective.name);
      expect(directiveController.loadingErrors).toEqual(expect.any(Array));
      expect(directiveController.loadingErrors).toHaveLength(0);
    });

    test('should return the default name in the case of error', () => {
      const directiveController = new DirectiveController(ant);
      expect(directiveController.getDirectiveName(nameErrorDirective)).toEqual(
        'NameErrorDirective'
      );
      expect(directiveController.loadingErrors).toEqual(expect.any(Array));
      expect(directiveController.loadingErrors).toHaveLength(1);
      expect(directiveController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(directiveController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Could not get directive name'));
    });

    test('should fail if the "directive" param is not a Directive instance', () => {
      expect(() => directiveController.getDirectiveName({})).toThrowError(
        'Could not get directive name: param "directive" should be Directive'
      );
    });
  });

  describe('DirectiveController.getDirectiveDefinition', () => {
    test('should return the directive\'s definition', () => {
      const directiveController = new DirectiveController(ant);
      expect(directiveController.getDirectiveDefinition(fooDirective))
        .toEqual(fooDirective.definition);
      expect(directiveController.loadingErrors).toEqual(expect.any(Array));
      expect(directiveController.loadingErrors).toHaveLength(0);
    });

    test('should store loading error in the case of error', () => {
      const directiveController = new DirectiveController(ant);
      expect(
        directiveController.getDirectiveDefinition(definitionErrorDirective)
      ).toEqual(null);
      expect(directiveController.loadingErrors).toEqual(expect.any(Array));
      expect(directiveController.loadingErrors).toHaveLength(1);
      expect(directiveController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(directiveController.loadingErrors[0].message)
        .toEqual(expect.stringContaining(
          'Could not get "fooDirective" directive definition'
        ));
    });

    test('should fail if the "directive" param is not a Directive instance', () => {
      expect(() => directiveController.getDirectiveDefinition({})).toThrowError(
        'Could not get directive definition: param "directive" should be \
Directive'
      );
    });
  });
});
