/* eslint-disable no-console */

const AWS = require('aws-sdk');
const { graphqlLambda } = require('apollo-server-lambda');
const { logger } = require('@back4app/ant-util');
const { Config, Ant } = require('@back4app/ant');
const { schemaHelper } = require('@back4app/ant-graphql');

logger.attachHandler(console.log);
logger.attachErrorHandler(console.error);

const ant = new Ant((new Config(Config.GetLocalConfigPath())).config);

ant.functionController.functions.forEach(antFunction => {
  antFunction.run = async (args) => {
    return await (new Promise((resolve, reject) => {
      (new AWS.Lambda()).invoke(
        {
          FunctionName: `${ant.service}-dev-${antFunction.name}`,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(args)
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            if (data.StatusCode === 200 && !data.FunctionError) {
              resolve(JSON.parse(data.Payload));
            } else {
              reject(data.Payload);
            }
          }
        }
      );
    }));
  };
});

const graphQL = ant.pluginController.getPlugin('GraphQL');

const schema = schemaHelper.generateSchema(
  ant,
  graphQL
);

exports.run = graphqlLambda({
  schema
});
