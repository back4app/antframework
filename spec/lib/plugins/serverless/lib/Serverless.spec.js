/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/serverless/lib/Serverless.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const AntError = require('../../../../../lib/util/AntError');
const logger = require('../../../../../lib/util/logger');
const Ant = require('../../../../../lib/Ant');
const Plugin = require('../../../../../lib/plugins/Plugin');
const Serverless = require(
  '../../../../../lib/plugins/serverless/lib/Serverless'
);
const AntFunction = require(
  '../../../../../lib/functions/AntFunction'
);
const LibFunction = require(
  '../../../../../lib/functions/LibFunction'
);
const Template = require(
  '../../../../../lib/templates/Template'
);

const ant = new Ant();

describe('lib/plugins/serverless/lib/Serverless.js', () => {
  test('should export "Serverless" class extending "Plugin" class', () => {
    const serverless = new Serverless(ant);
    expect(serverless.constructor.name).toEqual('Serverless');
    expect(serverless).toBeInstanceOf(Plugin);
    expect(serverless.name).toEqual('Serverless');
  });

  describe('Serverless.templates', () => {
    test('should be readonly and export default serverless template', () => {
      const serverless = new Serverless(ant);
      const templates = serverless.templates;
      serverless.templates = [];
      expect(serverless.templates).toEqual(templates);
      expect(templates).toEqual(expect.any(Array));
      expect(templates).toHaveLength(1);
      expect(templates[0].category).toEqual('Serverless');
      expect(templates[0].name).toEqual('Default');
    });
  });

  describe('Serverless.providers', () => {
    test('should be readonly and export serverless provider', () => {
      const serverless = new Serverless(ant);
      const providers = serverless.providers;
      serverless.providers = [];
      expect(serverless.providers).toEqual(providers);
      expect(providers).toEqual(expect.any(Array));
      expect(providers).toHaveLength(1);
      expect(providers[0].name).toEqual('Serverless');
    });
  });

  describe('Serverless.deploy', () => {
    test(
      'should build .serverless folder and call serverless CLI deploy command',
      async () => {
        expect.hasAssertions();
        const logFn = jest.fn();
        logger.attachHandler(logFn);
        const originalLog = console.log;
        console.log = jest.fn();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const serverless = new Serverless(ant);
        serverless._installAnt.run = (args, options) => {
          expect(args).toEqual(['install', '@back4app/antframework']);
          expect(options).toEqual(expect.any(Object));
          expect(options.cwd).toEqual(expect.stringContaining('.serverless'));
          serverless._serverlessCLI.run = (args, options) => {
            expect(args).toEqual(['deploy']);
            expect(options).toEqual(expect.any(Object));
            expect(options.cwd).toEqual(expect.stringContaining('.serverless'));
            return { subscribe: (onData, onError, onComplete) => {
              onData('Some data');
              expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Some data')
              );
              console.log = originalLog;
              let outDir = fs.readdirSync(outPath);
              expect(outDir).toEqual(expect.arrayContaining(['.serverless']));
              outDir = fs.readdirSync(path.resolve(outPath, '.serverless'));
              expect(outDir).toHaveLength(1);
              outDir = fs.readdirSync(path.resolve(
                outPath,
                '.serverless',
                outDir[0]
              ));
              expect(outDir).toEqual(expect.arrayContaining([
                'ant.yml',
                'model.graphql',
                'graphiQL.js',
                'graphQL.js',
                'libFunction.js',
                'package-lock.json',
                'package.json',
                'serverless.yml',
                'node_modules',
                'fooLibFunction.zip'
              ]));
              expect(outDir).toHaveLength(10);
              onComplete();
            }};
          };
          return { subscribe: (onData, onError, onComplete) => {
            onData('Some ant install data');
            expect(logFn).toHaveBeenCalledWith(
              expect.stringContaining('Some ant install data')
            );
            logger._handlers.delete(logFn);
            onComplete();
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        await serverless.deploy(
          { basePath: outPath },
          [
            new LibFunction(
              ant,
              'fooLibFunction',
              path.resolve(
                __dirname,
                '../../../../support/functions/fooLibFunction.js'
              ),
              ant.runtime
            )
          ]
        );

        fs.removeSync(outPath);
      }
    );

    test(
      'should keep files when using this option',
      async () => {
        expect.hasAssertions();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const serverless = new Serverless(ant, { basePath: outPath });
        serverless._installAnt.run = (args, options) => {
          expect(args).toEqual(['install', '@back4app/antframework']);
          expect(options).toEqual(expect.any(Object));
          expect(options.cwd).toEqual(expect.stringContaining('.serverless'));
          serverless._serverlessCLI.run = (args, options) => {
            expect(args).toEqual(['deploy']);
            expect(options).toEqual(expect.any(Object));
            expect(options.cwd).toEqual(expect.stringContaining('.serverless'));
            return { subscribe: (onData, onError, onComplete) => {
              onComplete();
            }};
          };
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        await serverless.deploy(
          { keepConfig: true },
          [
            new LibFunction(
              ant,
              'fooLibFunction',
              path.resolve(
                __dirname,
                '../../../../support/functions/fooLibFunction.js'
              ),
              ant.runtime
            )
          ]
        );
        let outDir = fs.readdirSync(outPath);
        expect(outDir).toEqual(expect.arrayContaining(['.serverless']));
        outDir = fs.readdirSync(path.resolve(outPath, '.serverless'));
        expect(outDir).toHaveLength(1);
        outDir = fs.readdirSync(path.resolve(
          outPath,
          '.serverless',
          outDir[0]
        ));
        expect(outDir).toEqual(expect.arrayContaining([
          'ant.yml',
          'model.graphql',
          'graphiQL.js',
          'graphQL.js',
          'libFunction.js',
          'package-lock.json',
          'package.json',
          'serverless.yml',
          'node_modules',
          'fooLibFunction.zip'
        ]));
        expect(outDir).toHaveLength(10);
        fs.removeSync(outPath);
      }
    );

    test(
      'should log error if cant remove output files',
      async () => {
        const errorFn = jest.fn();
        const logFn = log => {
          if (log === 'Serverless configuration files successfully removed') {
            throw new Error('Some deleting error');
          }
        };
        logger.attachErrorHandler(errorFn);
        logger.attachHandler(logFn);
        expect.hasAssertions();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            await (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const originalCwd = process.cwd();
        process.chdir(outPath);
        const serverless = new Serverless(ant);
        serverless._installAnt.run = () => {
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        serverless._serverlessCLI.run = () => {
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        await serverless.deploy(
          undefined,
          [
            new LibFunction(
              ant,
              'fooLibFunction',
              path.resolve(
                __dirname,
                '../../../../support/functions/fooLibFunction.js'
              ),
              ant.runtime
            )
          ]
        );
        expect(errorFn).toHaveBeenCalledWith(expect.any(AntError));
        logger._errorHandlers.delete(errorFn);
        logger._handlers.delete(logFn);
        process.chdir(originalCwd);
        fs.removeSync(outPath);
      }
    );

    test(
      'should fail if cannot render Serverless template',
      async () => {
        expect.hasAssertions();
        const template = new Template(
          'Serverless',
          'Default',
          '/foo/path'
        );
        template.render = () => { throw new Error('Rendering error'); };
        const ant = new Ant();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const serverless = new Serverless(ant);
        serverless._installAnt.run = () => {
          return { subscribe: (onData, onError) => {
            onError('Some install error');
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        ant.templateController.loadTemplates([template]);
        try {
          await serverless.deploy(
            { basePath: outPath },
            [
              new LibFunction(
                ant,
                'fooLibFunction',
                path.resolve(
                  __dirname,
                  '../../../../support/functions/fooLibFunction.js'
                ),
                ant.runtime
              )
            ]
          );
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'Could not render Serverless template'
          ));
        }
      }
    );

    test(
      'should fail if cannot install Ant Framework',
      async () => {
        expect.hasAssertions();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const serverless = new Serverless(ant);
        serverless._installAnt.run = () => {
          return { subscribe: (onData, onError) => {
            onError('Some install error');
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        try {
          await serverless.deploy(
            { basePath: outPath },
            [
              new LibFunction(
                ant,
                'fooLibFunction',
                path.resolve(
                  __dirname,
                  '../../../../support/functions/fooLibFunction.js'
                ),
                ant.runtime
              )
            ]
          );
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'Could not install Ant Framework'
          ));
          fs.removeSync(outPath);
        }
      }
    );

    test(
      'should fail if serverless CLI fails',
      async () => {
        expect.hasAssertions();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const serverless = new Serverless(ant);
        serverless._installAnt.run = () => {
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        serverless._serverlessCLI.run = () => {
          return { subscribe: (onData, onError) => {
            onError('Some CLI error');
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        try {
          await serverless.deploy(
            { basePath: outPath },
            [
              new LibFunction(
                ant,
                'fooLibFunction',
                path.resolve(
                  __dirname,
                  '../../../../support/functions/fooLibFunction.js'
                ),
                ant.runtime
              )
            ]
          );
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'Could not execute Serverless CLI'
          ));
          fs.removeSync(outPath);
        }
      }
    );

    test(
      'should fail if cant copy service files',
      async () => {
        const logFn = log => {
          if (log === 'Service configuration files successfully copied') {
            throw new Error('Some copy error');
          }
        };
        logger.attachHandler(logFn);
        expect.hasAssertions();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const serverless = new Serverless(ant);
        serverless._installAnt.run = () => {
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        serverless._serverlessCLI.run = () => {
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        try{
          await serverless.deploy(
            { basePath: outPath },
            [
              new LibFunction(
                ant,
                'fooLibFunction',
                path.resolve(
                  __dirname,
                  '../../../../support/functions/fooLibFunction.js'
                ),
                ant.runtime
              )
            ]
          );
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'Could not copy service configuration files'
          ));
          logger._handlers.delete(logFn);
          fs.removeSync(outPath);
        }
      }
    );

    test(
      'should fail if cant create artifact',
      async () => {
        const logFn = log => {
          if (log === 'Artifact successfully created') {
            throw new Error('Some artifact error');
          }
        };
        logger.attachHandler(logFn);
        expect.hasAssertions();
        const basePath = path.resolve(
          __dirname,
          '../../../../support/out/lib/plugins/serverless/lib/Serverless.js'
        );
        const outPath = path.resolve(
          basePath,
          'out' + Math.floor(Math.random() * 1000)
        );
        try {
          fs.removeSync(outPath);
        } finally {
          try {
            fs.ensureDirSync(basePath);
          } finally {
            (new Template(
              'service',
              'FooService',
              path.resolve(
                __dirname,
                '../../../../support/services/FooService'
              )
            )).render(outPath);
          }
        }
        const serverless = new Serverless(ant);
        serverless._installAnt.run = () => {
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        serverless._serverlessCLI.run = () => {
          return { subscribe: (onData, onError, onComplete) => {
            onComplete();
          }};
        };
        ant.pluginController.loadPlugins([serverless]);
        try{
          await serverless.deploy(
            { basePath: outPath },
            [
              new LibFunction(
                ant,
                'fooLibFunction',
                path.resolve(
                  __dirname,
                  '../../../../support/functions/fooLibFunction.js'
                ),
                ant.runtime
              )
            ]
          );
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'Could not generate "fooLibFunction" function\'s artifact'
          ));
          logger._handlers.delete(logFn);
          fs.removeSync(outPath);
        }
      }
    );

    test('should fail if config is not an Object', async () => {
      expect.hasAssertions();
      const serverless = new Serverless(ant);
      try {
        await serverless.deploy(() => {});
      } catch (e) {
        expect(e.message).toEqual(expect.stringContaining(
          'Could not deploy functions: param "config" should be Object'
        ));
      }
    });

    test(
      'should fail if function is not an Array with ate least 1 Function',
      async () => {
        expect.assertions(4);
        const serverless = new Serverless(ant);
        try {
          await serverless.deploy({});
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'Could not deploy functions: param "functions" should be Array'
          ));
        }
        try {
          await serverless.deploy(undefined, {});
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'Could not deploy functions: param "functions" should be Array'
          ));
        }
        try {
          await serverless.deploy(null, []);
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'There are no functions to be deployed'
          ));
        }
        try {
          await serverless.deploy({}, [{}]);
        } catch (e) {
          expect(e.message).toEqual(expect.stringContaining(
            'should be AntFunction'
          ));
        }
      }
    );

    test('should fail if could not find template', async () => {
      const ant = new Ant();
      expect.hasAssertions();
      const serverless = new Serverless(ant);
      try {
        await serverless.deploy(
          { template: 'fooTemplate' },
          [new AntFunction(ant, 'fooFunction')]
        );
      } catch (e) {
        expect(e.message).toEqual(expect.stringContaining(
          'Could not deploy functions: could not find "fooTemplate" template'
        ));
      }
      try {
        await serverless.deploy(
          undefined,
          [new AntFunction(ant, 'fooFunction')]
        );
      } catch (e) {
        expect(e.message).toEqual(expect.stringContaining(
          'Could not deploy functions: could not find "Default" template'
        ));
      }
    });
  });
});
