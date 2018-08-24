const { graphiqlLambda } = require('apollo-server-lambda');

exports.run = graphiqlLambda({
  endpointURL: '/dev/graphql',
});
