/**
 * @fileoverview Defines and exports a {@link DefinitionErrorDirective}
 * {@link Plugin} class for testing purposes.
 */

const { GraphQL } = require('@back4app/antframework');
const { Directive } = GraphQL;

/**
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
