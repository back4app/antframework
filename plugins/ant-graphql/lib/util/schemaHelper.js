/**
 * Exports util functions to help leading with [GraphQL]{@link https://github.com/graphql/graphql-js}
 * schema.
 * @module ant-graphql/util
 */

const { Observable } = require('@back4app/ant-util-rxjs/node_modules/rxjs');
const { parse, buildASTSchema, validateSchema } = require('graphql');
const { logger } = require('@back4app/ant-util');
const { AntFunction } = require('@back4app/ant');

/**
 * Helper function that can be used to generate a GraphQL schema from Ant
 * Framework's config.
 * @param {Ant} ant The {@link Ant} framework instance.
 * @param {GraphQL} graphQL The {@link GraphQL} plugin instance.
 * @param {String} _model An optional pre-loaded GraphQL model to be used
 * instead of requiring the GraphQL plugin to load a new one.
 * @return {Object} The generated [GraphQLSchema]{@link https://github.com/graphql/graphql-js/blob/f8438f73baa64d8047fd766a8f38e169198ff141/src/type/schema.js#L79}.
 */
function generateSchema(ant, graphQL, _model) {
  let model = [];

  if (graphQL) {
    for (const directive of graphQL.directiveController.directives) {
      const directiveDefinition = graphQL.directiveController
        .getDirectiveDefinition(directive);
      if (directiveDefinition) {
        model.push(directiveDefinition);
      }
    }
  }

  if (_model === undefined && graphQL) {
    _model = graphQL.getModel();
  }

  if (_model) {
    model.push(_model);
  }

  model = model.join('\n');

  if (model.length) {
    const astDocument = parse(model);

    const schema = buildASTSchema(astDocument);

    // This code will be better componentized and improved. Essentially it
    // visits a GraphQL schema and look for each of its types, then each of
    // the fields of the types that were found before and finally each of the
    // directives of the fields that were found before. If it is a "mock"
    // directive, a resolve function is attached to the field.
    for (const typeName in schema._typeMap) {
      const type = schema._typeMap[typeName];
      for (const fieldName in type._fields) {
        const field = type._fields[fieldName];
        if (field.astNode && field.astNode.directives) {
          for (const directive of field.astNode.directives) {
            const directiveName = directive.name.value;
            let directiveResolved = false;
            if (graphQL) {
              const antDirective = graphQL.directiveController
                .getDirective(directiveName);
              if (antDirective) {
                directiveResolved = true;
                const directiveArgs = {};
                for (const arg of directive.arguments) {
                  directiveArgs[arg.name.value] = arg.value.value;
                }
                if (directiveName === 'subscribe') {
                  field.subscribe = (source, fieldArgs, context, info) => antDirective.resolver.run(
                    ant,
                    info,
                    directiveArgs,
                    fieldArgs
                  );
                  continue;
                }
                const currentResolver = field.resolve;
                const directiveResolver = antDirective.resolver;

                field.resolve = (_, fieldArgs) => {
                  // We can't provide Ant to any kind of AntFunction, due to
                  // serialization issues, so the class check is needed here
                  const resolvedValue = directiveResolver.run(
                    directiveResolver.constructor.name === AntFunction.name ? ant : undefined,
                    directiveArgs,
                    fieldArgs,
                    currentResolver ? currentResolver(_, fieldArgs) : undefined,
                    { type, field, directive }
                  );

                  // The resolver should garantee the content resolved is compatible
                  // with the type specified in the GraphQL model.
                  // If the GraphQL model requires an Array and the resolver returns an
                  // Observable, for instance, the resolver needs to pipe its Observable
                  // into toArray before returning it; since there is no way
                  // to predict what the resolver implementation returns and treat it somehow.
                  if (resolvedValue instanceof Observable) {
                    return resolvedValue.toPromise();
                  }
                  return resolvedValue;
                };
              }
            }
            if (!directiveResolved) {
              logger.error(`Could not find "${directiveName}" directive`);
            }
          }
        }
      }
    }

    const errors = validateSchema(schema);
    if (errors && errors.length) {
      logger.error(
        'There were some errors when validating the GraphQL schema:'
      );
      errors.forEach(error => logger.error(error.toString()));
    }

    return schema;
  } else {
    return null;
  }
}

module.exports.generateSchema = generateSchema;
