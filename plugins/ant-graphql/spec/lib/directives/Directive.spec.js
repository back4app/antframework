/**
 * @fileoverview Tests for lib/directives/Directive.js file.
 */

const { AntFunction, Ant } = require('@back4app/ant');
const Directive = require(
  '../../../lib/directives/Directive'
);

const ant = new Ant();
const fooFunction = new AntFunction(ant, 'fooFunction');
const fooDirective = new Directive(
  ant,
  'fooDirective',
  'fooDefinition',
  fooFunction
);

describe('lib/directives/Directive.js', () => {
  test('should export "Directive" class', () => {
    expect(fooDirective.constructor.name).toEqual('Directive');
  });

  test('should fail if ant param is invalid', () => {
    expect(() => new Directive()).toThrowError(
      'Could not initialize the directive: param "ant" should be Ant'
    );
    expect(() => new Directive({})).toThrowError(
      'Could not initialize the directive: param "ant" should be Ant'
    );
  });

  test('should fail if the name is not String', () => {
    expect(() => new Directive(ant)).toThrowError(
      'Could not initialize Directive: param "name" should be String'
    );
    expect(() => new Directive(ant, {})).toThrowError(
      'Could not initialize Directive: param "name" should be String'
    );
  });

  test('should fail if the definition is not String', () => {
    expect(() => new Directive(ant, 'fooDirective')).toThrowError(
      'Could not initialize Directive: param "definition" should be String'
    );
    expect(() => new Directive(ant, 'fooDirective', {})).toThrowError(
      'Could not initialize Directive: param "definition" should be String'
    );
  });

  test('should fail if the resolver is not AntFunction', () => {
    expect(() => new Directive(ant, 'fooDirective', 'fooDefinition'))
      .toThrowError(
        'Could not initialize Directive: param "resolver" should be AntFunction'
      );
    expect(() => new Directive(ant, 'fooDirective', 'fooDefinition', {}))
      .toThrowError(
        'Could not initialize Directive: param "resolver" should be AntFunction'
      );
  });

  describe('Directive.ant', () => {
    test('should be readonly', () => {
      expect(fooDirective.ant).toEqual(ant);
      fooDirective.ant = new Ant();
      expect(fooDirective.ant).toEqual(ant);
    });
  });

  describe('Directive.name', () => {
    test('should be readonly', () => {
      expect(fooDirective.name).toEqual('fooDirective');
      fooDirective.name = 'otherDirective';
      expect(fooDirective.name).toEqual('fooDirective');
    });
  });

  describe('Directive.definition', () => {
    test('should be readonly', () => {
      expect(fooDirective.definition).toEqual('fooDefinition');
      fooDirective.definition = 'otherDefinition';
      expect(fooDirective.definition).toEqual('fooDefinition');
    });
  });

  describe('Directive.resolver', () => {
    test('should be readonly', () => {
      expect(fooDirective.resolver).toEqual(fooFunction);
      fooDirective.resolver = new AntFunction(ant, 'otherFunction');
      expect(fooDirective.resolver).toEqual(fooFunction);
    });
  });
});
