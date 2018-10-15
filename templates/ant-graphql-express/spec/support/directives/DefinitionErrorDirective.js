/**
 * @fileoverview Defines and exports a {@link DefinitionErrorDirective}
 * {@link Plugin} class for testing purposes.
 */

const { Directive } = require('@back4app/ant-graphql');

/**
 * @class ant-graphql-express/DefinitionErrorDirective
 * Represents a {@link Directive} that overrides the definition member and
 * throws an error for testing purposes.
 * @extends DefinitionErrorDirective
 * @private
 */
class DefinitionErrorDirective extends Directive {
  get definition() {
    throw new Error('Some definition error');
  }
}

module.exports = DefinitionErrorDirective;
