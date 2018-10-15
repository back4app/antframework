/**
 * @fileoverview Defines and exports a {@link DirectiveDefinitionErrorPlugin}
 * {@link Plugin} class for testing purposes.
 */

const { AntFunction, Plugin } = require('@back4app/ant');
const DefinitionErrorDirective = require(
  '../directives/DefinitionErrorDirective'
);

/**
 * @class ant-graphql-express/DirectiveDefinitionErrorPlugin
 * Represents a {@link Plugin} that returns a directive with definition error
 * for testing purposes.
 * @extends Plugin
 * @private
 */
class DirectiveDefinitionErrorPlugin extends Plugin {
  get directives() {
    return [
      new DefinitionErrorDirective(
        this._ant,
        'fooDirective',
        'fooDefinition',
        new AntFunction(this._ant, 'fooFunction')
      )
    ];
  }
}

module.exports = DirectiveDefinitionErrorPlugin;
