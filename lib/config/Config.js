/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Config} class.
 */

const AntError = require('../util/AntError');
const assert = require('assert');
const fs = require('fs');
const logger = require('../util/logger');
const path = require('path');
const yaml = require('yaml').default;
const Map = require('yaml/map').default;
const Pair = require('yaml/pair').default;
const Scalar = require('yaml/scalar').default;
const Seq = require('yaml/seq').default;
const Template = require('../templates/Template');
const Host = require('../hosts/Host');
const BasepathResolver = require('./handler/BasepathResolver');
const PluginsPathResolver = require('./handler/PluginsPathResolver');
const TemplatesPathResolver = require('./handler/TemplatesPathResolver');
const VariablesResolver = require('./handler/VariablesResolver');
const FunctionsPathResolver = require('./handler/FunctionsPathResolver');
const RuntimesPathResolver = require('./handler/RuntimesPathResolver');
const BinFunction = require('../functions/BinFunction');
const LibFunction = require('../functions/LibFunction');
const Runtime = require('../functions/runtimes/Runtime');

/**
 * Represents the configuration of the {@link Ant} class.
 * It was created to simplify the process of manipulating configuration files,
 * making it easier to retrieve and save new configurations.
 *
 * @param {!String|Object} params The configuration file path or an object
 * representing the configuration itself. If an object is provided, the next
 * {@link #save} call must provide a path to set where the YAML document
 * will be created.
 */
class Config {
  constructor(params) {
    assert(params, 'Parameter "params" can not be undefined');
    assert(typeof params === 'string' || typeof params === 'object', 'Configuration \
file "params" must be a string (configuration file path) or object');
    this._jsonHandlers = Config.DefaultJSONHandlers;
    if (typeof params === 'string') {
      this._path = params;
      if (fs.existsSync(this._path)) {
        const configFileContent = fs.readFileSync(this._path, 'utf-8');
        // If file is empty, does not try to parse it.
        if (configFileContent) {
          try {
            this._config = yaml.parseDocument(configFileContent);
            const configJson = this._config.toJSON();
            if(typeof configJson === 'string') {
              throw new AntError(`The configuration "${configJson}" is invalid`);
            }
            return;
          } catch (e) {
            throw new AntError(
              `Could not load config ${this._path}`,
              e
            );
          }
        }
        this._config = new yaml.Document();
        this._config.contents = new Map();
        fs.writeFileSync(this._path, this._config.toString());
        logger.log(`Configuration file successfully written at: ${this._path}`);
      } else {
        throw new AntError(`Could not load config at "${this._path}".`);
      }
    } else {
      // Stringifies the configuration at "params" and then parses it to
      // generate our YAML document tree.
      this._config = yaml.parseDocument(yaml.stringify(params));
    }
  }

  /**
   * Retrieve the file path of this configuration.
   *
   * @returns {String} the file path of this configuration
   */
  get path() {
    return this._path;
  }

  /**
   * Returns a JSON representation of this configuration.
   *
   * @returns {Object} the JSON representation of this configuration
   */
  get config() {
    if (!this._cachedJson) {
      const json = this._config.toJSON();
      for (const jsonHandler of this._jsonHandlers) {
        jsonHandler.handle(json, { filePath: this._path });
      }
      this._cachedJson = json;
    }
    return this._cachedJson;
  }

  /**
   * Adds the plugin into this configuration.
   *
   * @param {!String} plugin The path to the plugin files
   * @returns {Config} This configuration instance.
   */
  addPlugin(plugin) {
    assert(plugin, 'Could not add plugin: param "plugin" is required');
    assert(
      typeof plugin === 'string',
      'Could not add plugin: param "plugin" should be String'
    );

    let plugins = this._config.contents.items.find(
      item => item.key.value === 'plugins'
    );
    if (!plugins) {
      plugins = new Pair(new Scalar('plugins'), new Seq());
      this._config.contents.items.push(plugins);
    }
    if (plugins.value && plugins.value.items && plugins.value.items.find(
      item => item.value === plugin
    )) {
      console.log(`Plugin "${plugin}" already found on current config. \
plugin add command should do nothing`);
      return this;
    }
    logger.log(`Adding plugin ${plugin} into configuration file ${this._path}`);
    plugins.value.items.push(new Scalar(plugin));
    console.log(`Plugin "${plugin}" successfully added on configuration file ${this._path}`);

    // Document has changed, resets the cached JSON
    this._cachedJson = null;
    return this;
  }

  /**
   * Removes the plugin from this configuration.
   *
   * @param {!String} plugin The path to the plugin files
   * @returns {Config} This configuration instance.
   */
  removePlugin(plugin) {
    assert(plugin, 'Could not remove plugin: param "plugin" is required');
    assert(
      typeof plugin === 'string',
      'Could not remove plugin: param "plugin" should be String'
    );
    const plugins = this._config.contents.items.find(item => item.key.value === 'plugins');
    if (!plugins || !plugins.value || !plugins.value.items) {
      console.log('No plugins was found on configuration file. plugin \
remove command should do nothing');
      return this;
    }
    if (!plugins.value.items.find(item => item === plugin || item.value)) {
      console.log(`Plugin "${plugin}" was not found on configuration file. \
plugin remove command should do nothing`);
      return this;
    }
    plugins.value.items = plugins.value.items.filter(item => item.value !== plugin);
    this._cleanPluginsNode(plugins);
    console.log(`Plugin "${plugin}" successfully removed from configuration file ${this._path}`);

    // Document has changed, resets the cached JSON
    this._cachedJson = null;
    return this;
  }

  /**
   * Adds/overrides a template into this configuration.
   *
   * If the configuration does not contains the "templates" entry and its subtree,
   * automatically creates it and all required nodes in order to add the template.
   * If the template already exists under the category specified, it will be
   * overwritten with the new templatePath.
   *
   * @param {!String} category The template category
   * @param {!String} template The template name
   * @param {!String} templatePath The absolute path to the template files
   * @returns {Config} This configuration instance.
   */
  addTemplate(category, template, templatePath) {
    assert(category, 'Could not add template: param "category" is required');
    assert(
      typeof category === 'string',
      'Could not add template: param "category" should be String'
    );
    assert(template, 'Could not add template: param "template" is required');
    assert(
      typeof template === 'string',
      'Could not add template: param "template" should be String'
    );
    assert(templatePath, 'Could not add template: param "templatePath" is required');
    assert(
      typeof templatePath === 'string',
      'Could not add template: param "templatePath" should be String'
    );

    let templates = this._config.contents.items.find(
      item => item.key.value === 'templates'
    );
    if (!templates) {
      templates = new Pair(new Scalar('templates'), new Map());
      this._config.contents.items.push(templates);
    }
    let configCategory = templates.value.items.find(item => item.key.value === category);
    if (!configCategory) {
      configCategory = new Pair(new Scalar(category), new Map());
      templates.value.items.push(configCategory);
    }
    let configTemplate = configCategory.value.items.find(item => item.key.value === template);
    logger.log(`Adding template "${template}" with category "${category}" and path \
"${templatePath}" into configuration file ${this._path}`);
    if (!configTemplate) {
      configTemplate = new Pair(new Scalar(template), new Scalar(templatePath));
      configCategory.value.items.push(configTemplate);
    } else {
      console.log(`Template "${template}" already found on current config. \
template add command will OVERRIDE the current template`);
      configTemplate.value = new Scalar(templatePath);
    }
    console.log(`Template "${template}" successfully added on configuration file ${this._path}`);

    // Document has changed, resets the cached JSON
    this._cachedJson = null;
    return this;
  }

  /**
   * Removes the template from this configuration.
   *
   * Does nothing if the "templates" entry is not defined in the configuration file.
   * Does nothing if the "templates" entry does not contains the category given as argument.
   * Does nothing if the template was not found under the category specified.
   *
   * @param {!String} category The template category
   * @param {!String} template The template name
   * @returns {Config} This configuration instance.
   */
  removeTemplate(category, template) {
    assert(category, 'Could not remove template: param "category" is required');
    assert(
      typeof category === 'string',
      'Could not remove template: param "category" should be String'
    );
    assert(template, 'Could not remove template: param "template" is required');
    assert(
      typeof template === 'string',
      'Could not remove template: param "template" should be String'
    );

    const templates = this._config.contents.items.find(
      item => item.key.value === 'templates'
    );
    if (!templates) {
      console.log('"templates" entry was not found on the configuration. template \
remove command should do nothing');
      return this;
    }
    const configCategory = templates.value.items.find(item => item.key.value === category);
    if (!configCategory) {
      console.log(`Template category "${category}" was not found on the \
configuration. template remove command should do nothing`);
      return this;
    }
    const configTemplate = configCategory.value.items.find(item => item.key.value === template);
    if (!configTemplate) {
      console.log(`Template "${template}" was not found on the configuration. \
template remove command should do nothing`);
      return this;
    }
    configCategory.value.items = configCategory.value.items.filter(item => item.key.value !== template);
    this._cleanRootNode(templates);
    console.log(`Template "${template}" successfully removed from configuration file ${this._path}`);

    // Document has changed, resets the cached JSON
    this._cachedJson = null;
    return this;
  }

  /**
   * Adds a {@link BinFunction} or {@link LibFunction} into this configuration.
   *
   * @param {!BinFunction|LibFunction} antFunction The function to be added
   * @returns {Config} This configuration instance.
   */
  addFunction(antFunction) {
    assert(antFunction, 'Param "antFunction" is required');
    assert((antFunction instanceof BinFunction || antFunction instanceof LibFunction),
      'Param "antFunction" must be an instance of BinFunction or LibFunction');

    const { name, bin, handler, runtime } = antFunction;
    let functions = this._config.contents.items.find(
      item => item.key.value === 'functions'
    );
    if (!functions) {
      functions = new Pair(
        new Scalar('functions'),
        new Map()
      );
      this._config.contents.items.push(functions);
    }
    let functionNode = functions.value && functions.value.items && functions.value.items.find(
      func => func && func.key && func.key.value === name
    );
    const attributes = new Map();
    if (functionNode) {
      console.log(`Function "${name}" already found on the configuration file. \
function add command will OVERRIDE the current function`);
      functionNode.value = attributes;
    } else {
      logger.log(`Adding function ${name} into configuration file ${this._path}`);
      functionNode = new Pair(new Scalar(name), attributes);
      functions.value.items.push(functionNode);
    }
    if (antFunction instanceof BinFunction) {
      attributes.items.push(new Pair(new Scalar('bin'), new Scalar(bin)));
    } else {
      attributes.items.push(new Pair(new Scalar('handler'), new Scalar(handler)));
      attributes.items.push(new Pair(new Scalar('runtime'), new Scalar(runtime.name)));
    }
    console.log(`Function "${name}" successfully added on configuration file ${this._path}`);
    // Document has changed, resets the cached JSON
    this._cachedJson = null;
    return this;
  }

  /**
   * Removes an AntFunction from this configuration.
   *
   * @param {!String} antFunction The name of the AntFunction to be removed
   * @returns {Config} This configuration instance.
   */
  removeFunction(antFunction) {
    assert(antFunction, 'Could not remove function: param "antFunction" is required');
    assert(
      typeof antFunction === 'string',
      'Could not remove function: param "antFunction" should be String'
    );
    const functions = this._config.contents.items.find(
      item => item.key.value === 'functions'
    );
    if (!functions || !functions.value || !functions.value.items) {
      console.log('No functions was found on configuration file. function \
remove command should do nothing');
      return this;
    }
    if (!functions.value.items.find(func => func.key.value === antFunction)) {
      console.log(`Function "${antFunction}" was not found on configuration file. \
function remove command should do nothing`);
      return this;
    }
    functions.value.items = functions.value.items.filter(
      func => func.key.value !== antFunction
    );
    this._cleanRootNode(functions);
    console.log(`Function "${antFunction}" successfully removed from configuration file ${this._path}`);

    // Document has changed, resets the cached JSON
    this._cachedJson = null;
    return this;
  }

  /**
   * Adds/overrides a {@link Runtime} into this configuration.
   *
   * @param {!Runtime} runtime The {@link Runtime} to be added
   * @returns {Config} This configuration instance.
   */
  addRuntime(runtime) {
    assert(runtime, 'Param "runtime" is required');
    assert(runtime instanceof Runtime,
      'Param "runtime" must be an instance of Runtime');
    const { name, bin, extensions } = runtime;

    // Ensure the "runtimes" root element exists,
    // and it is a Pair<"runtimes", Map>
    const runtimes = this._ensureRootCollectionNode('runtimes', Map);

    if (this._filterNodeFromCollectionByKey(runtimes, name)) {
      console.log(`Runtime "${name}" already found on the configuration file. \
runtime add command will OVERRIDE the current runtime`);
    }
    logger.log(`Adding runtime ${name} into configuration file ${this._path}`);

    // Creates the brand new Runtime node and adds its to the runtimes Map.
    runtimes.items.push(new Pair(
      new Scalar(name),
      this._createAttributeMap({ bin, extensions })
    ));

    // Document has changed, resets the cached JSON
    this._cachedJson = null;
    return this;
  }

  /**
   * Removes an {@link Runtime} from this configuration.
   *
   * @param {!String} runtime The name of the {@link Runtime} to be removed
   * @returns {Config} This configuration instance.
   */
  removeRuntime(runtime) {
    assert(runtime, 'Could not remove runtime: param "runtime" is required');
    assert(
      typeof runtime === 'string',
      'Could not remove runtime: param "runtime" should be String'
    );
    const runtimes = this._findRootCollectionNode('runtimes', Map);
    if (!runtimes) {
      console.log('No "runtimes" was found on configuration file. runtime \
remove command should do nothing');
      return this;
    }
    if(this._filterNodeFromCollectionByKey(runtimes, runtime)) {
      this._cleanRootNode(runtimes);
      console.log(`Runtime "${runtime}" successfully removed from \
configuration file ${this._path}`);

      // Document has changed, resets the cached JSON
      this._cachedJson = null;
    } else {
      console.log(`Runtime "${runtime}" was not found on configuration file. \
runtime remove command should do nothing`);
    }
    return this;
  }

  /**
   * Finds and returns the first collection root node with given name and class.
   * If the collection was not found, ensures it was created, and then returns it.
   *
   * It is expected for this collection to be inside of a Pair instance, where
   * the key is the name of the node, and the value is the collection itself.
   *
   * @param {!String} name The name of the node to be searched
   * @param {!Map|Seq} collClass The collection class to be searched
   * @returns {Map|Seq} The collection found/created
   */
  _ensureRootCollectionNode(name, collClass) {
    const rootNode = this._config.contents.items.find(
      node => node.key.value === name
    );
    // If root node was found, but it is an instance of
    // an unexpected class, we must replace this node with the
    // collection expected
    if (rootNode) {
      if (!(rootNode instanceof Pair) || !(rootNode.value instanceof collClass)) {
        this._config.contents.items = this._config.contents.items.filter(
          node => node !== rootNode
        );
      } else {
        return rootNode.value;
      }
    }
    // If root node is unexistant, creates it
    const collNode = new collClass();
    this._config.contents.items.push(new Pair(
      new Scalar(name), collNode
    ));
    return collNode;
  }

  /**
   * Finds and returns the first collection root node with given name and class,
   * or null if it was not found.
   * Similar to the {@link #_ensureRootCollectionNode}, but makes no changes
   * to the node tree.
   *
   * @param {!String} name The name of the node to be searched
   * @param {!Map|Seq} collClass The collection class to be searched
   * @returns {Map|Seq} The root collection node, or null if it was not found
   */
  _findRootCollectionNode(name, collClass) {
    const rootNodePair = this._config.contents.items.find(
      item => item.key.value === name && item.value instanceof collClass
    );
    if (!rootNodePair) {
      return null;
    }
    return rootNodePair.value;
  }

  /**
   * Filters an {@link Pair} element from a collection by its key, and
   * returns a boolean indicating the collection has changed.
   *
   * @param {!Map|Seq} coll The collection to be filtered
   * @param {String} key The key of the element to be filtered
   * @returns {Boolean} True if the collection has changed, false otherwise
   */
  _filterNodeFromCollectionByKey(coll, key) {
    const originalLength = coll.items.length;
    coll.items = coll.items.filter(item => item.key && item.key.value !== key);
    return originalLength !== coll.items.length;
  }

  /**
   * Transfers all attributes from an {@link Object} to a new instance
   * of {@link Map}. If the attribute is an {@link Array}, converts it into
   * a instance of {@link Seq}. Otherwise, it is put into the {@link Map} as
   * a {@link Scalar}.
   *
   * Since it expects no {@link Object} attribute, it was not handled
   * by this function.
   *
   * @param {!Object} attributes An object containing all attributes
   * to be transfered to the {@link Map}
   * @returns {Map} A instance of {@link Map} containing all attributes
   * from the "attributes" parameter
   */
  _createAttributeMap(attributes) {
    const map = new Map();
    for(const [key, value] of Object.entries(attributes)) {
      if (value) {
        let valueNode;
        if (value instanceof Array) {
          const seq = new Seq();
          seq.items = seq.items.concat(value);
          valueNode = seq;
        } else {
          valueNode = new Scalar(value);
        }
        map.items.push(new Pair(
          new Scalar(key),
          valueNode
        ));
      }
    }
    return map;
  }

  /**
   * Writes this configuration content to the file.
   * @param {String} path The file path of this configuration file.
   * Only required when this instance was constructed without providing
   * a file path.
   * @returns {String} The file path of this configuration.
   * @throws {AntError} If this configuration file path is not set, and
   * no path was provided on this call.
   */
  save(path) {
    // Once this._path is set, we no longer must support any changes to it.
    if (!this._path) {
      if (!path) {
        throw new AntError('The configuration file path was not provided to \
save the file.');
      }
      this._path = path;
    }
    const configFileContent = this._config.toString();
    fs.writeFileSync(this._path, configFileContent);
    logger.log(`Configutarion file successfully written in ${this._path}`);
    logger.log(`Content written:\n${configFileContent}`);
    return this._path;
  }

  /**
   * Given a root node, searches and removes recursively any
   * empty node from the configuration YAML document tree.
   *
   * @param {Node} node The root node to be cleansed
   */
  _cleanRootNode(node) {
    if (node && this._cleanNode(node)) {
      const rootNode = this._config.contents;
      rootNode.items.splice(rootNode.items.indexOf(node), 1);
    }
  }

  /**
   * Given the `plugins` node, searches and replaces any empty plugin
   * configuration node with a scalar node.
   * It is different from the {@link Config#_cleanRootNode} because
   * the empty plugin nodes can not be removed.
   *
   * @param {Node} plugins The `plugins` node from the configuration file
   */
  _cleanPluginsNode(plugins) {
    plugins.value.items = plugins.value.items.map(pluginNode => {
      // If the pluginNode is a map, then its key is the plugin name,
      // and its value is the configuration node
      if (pluginNode instanceof Map) {
        const pluginPair = pluginNode.items[0];
        const pluginConfig = pluginPair.value;
        // Checks if the configuration node is actually a map and if it is empty.
        // If true, then replaces it with a scalar node
        if (pluginConfig instanceof Map && this._cleanNode(pluginConfig)) {
          const pluginName = pluginPair.key.value;
          return new Scalar(pluginName);
        }
      }
      return pluginNode;
    });
  }

  /**
   * Given a {@link Node}, searches and removes recursively any empty {@link Map}
   * or {@link Seq} which has no child elements.
   * After removing the empty nodes, returns `true` if node is empty, or `false`
   * otherwise.
   * If {@link Node} is an instance of {@link Pair}, checks if its value is empty.
   * If {@link Node} is an instance of {@link Scalar} it is considered as not empty.
   *
   * @param {Node} node The node whose empty nodes shall be cleansed
   * @returns {Boolean} true if node is empty, false if not
   */
  _cleanNode(node) {
    if (node instanceof Seq || node instanceof Map) {
      let isCollEmpty = true;
      // Filters all empty nodes from this collection and also updates the
      // flag indicating this collection is either empty or not
      node.items = node.items.filter(child => {
        const isEmpty = this._cleanNode(child);
        if (isEmpty) {
          return false;
        }
        isCollEmpty = false;
        return true;
      });
      return isCollEmpty;
    } else if (node instanceof Pair) {
      return this._cleanNode(node.value);
    }
    return false;
  }

  /**
   * Returns the global configuration.
   *
   * @returns {Config} The global configuration.
   * @static
   */
  static get Global () {
    return new Config(path.resolve(__dirname, '../globalConfig.yml'));
  }

  /**
   * Parses the framework templates from the config file templates object.
   *
   * @param {Object} templatesConfig An object with following structure:
   *   {
   *     <Category_Name>: {
   *       <Template_Name> : <Template_Path>,
   *       ...
   *     },
   *     ...
   *   }
   * @param {String} basePath The base path defined in the configuration file.
   * This is used to define the template files path, in case it is relative.
   * @static
   * @returns {Array<Template>} An array of {@link Template} parsed from
   * the templatesConfig object
   */
  static ParseConfigTemplates(templatesConfig, basePath) {
    const parsedTemplates = [];
    if (templatesConfig) {
      assert(typeof templatesConfig === 'object', 'Error while loading templates \
from Ant\'s config file. The "template" configuration should be an object!');

      // Iterates over categories found on the config file
      for (const category in templatesConfig) {
        const templates = templatesConfig[category];
        assert(typeof templates === 'object', 'Error while loading templates from \
Ant\'s config file: Template category value is not an object!');
        // Iterates over templates from current category
        for (const template in templates) {
          let templatePath = templates[template];
          // If there is a base path, and our template path is not absolute
          // we must append the base into our template path.
          if (basePath && !templatePath.startsWith('/')) {
            templatePath = path.resolve(basePath, templatePath);
          }
          parsedTemplates.push(new Template(category, template, templatePath));
        }
      }
    }
    return parsedTemplates;
  }

  /**
   * Parses the framework hosts from the config file hosts object.
   *
   * @param {Object} hostsConfig An object with following structure:
   *   {
   *     <Host_Name>: {
   *       provider: <Provider_Name>,
   *       config: { ... }
   *     },
   *     ...
   *   }
   * @static
   * @returns {Array<Host>} An array of {@link Host} parsed from
   * the hostsConfig object
   */
  static ParseConfigHosts(hostsConfig, providerController) {
    const parsedHosts = [];
    if (hostsConfig) {
      assert(typeof hostsConfig === 'object', 'Error while loading hosts \
from Ant\'s config file. The "hosts" configuration should be an object!');

      // Iterates over hosts found on the config file
      for (const hostName in hostsConfig) {
        const host = hostsConfig[hostName];
        assert(typeof host === 'object', 'Error while loading hosts from \
Ant\'s config file: Host value is not an object!');
        const providerName = host.provider;
        assert(
          providerName,
          'Error while loading hosts from Ant\'s config file: provider is \
required'
        );
        const provider = providerController.getProvider(providerName);
        assert(
          provider,
          `Error while loading hosts from Ant's config file: could not find \
provider "${providerName}"`
        );
        parsedHosts.push(new Host(hostName, provider, host.config));
      }
    }
    return parsedHosts;
  }

  /**
   * Parses the AntFunctions from the config file functions array.
   *
   * @param {Object} functions The "functions" object from the configuration file, where
   * the key is the function name, and the value is an object with its attributes.
   * @param {RuntimeController} runtimeController The {@link RuntimeController} used
   * to resolve the runtime instance of the {@link LibFunction}.
   * @static
   * @returns {Array} An array of {@link BinFunction} and {@link LibFunction} parsed
   * from the functions array
   */
  static ParseConfigFunctions(functions, runtimeController) {
    if (!functions) {
      return [];
    }
    return Object.keys(functions).map(name => {
      const func = functions[name];
      const { bin, handler, runtime } = func;
      try {
        if (bin) {
          return new BinFunction(runtimeController.ant, name, bin);
        } else if (handler) {
          let runtimeInstance;
          if (runtime) {
            runtimeInstance = runtimeController.getRuntime(runtime);
            if (!runtimeInstance) {
              throw new AntError(`Runtime ${runtime} was not found`);
            }
          } else {
            runtimeInstance = runtimeController.defaultRuntime;
          }
          return new LibFunction(runtimeController.ant, name, handler, runtimeInstance);
        }
        throw new AntError(`Function type unknown: ${JSON.stringify(func)}`);
      } catch (e) {
        throw new AntError('Could not parse AntFunction from \
configuration file', e);
      }
    });
  }

  /**
   * Parses the {@link Runtime} from the configuration file "runtimes" array.
   *
   * @param {!Object} runtimes The runtimes object from the configuration file.
   * @param {!Ant} ant the {@link Ant} instance used to instantiate new {@link Runtime}
   * @returns {Array<Runtime>} The array of parsed {@link Runtime}
   * @static
   */
  static ParseConfigRuntimes(runtimes, ant) {
    if (!runtimes) {
      return [];
    }
    return Object.keys(runtimes).map(
      name => new Runtime(ant, name, runtimes[name].bin, runtimes[name].extensions)
    );
  }

  /**
   * Parses the {@link Runtime} from the configuration file "defaultRuntime" string.
   *
   * @param {Object} defaultRuntime The "defaultRuntime" object from the configuration file
   * @param {!RuntimeController} runtimeController The {@link RuntimeController}
   * used to find the default {@link Runtime}
   * @returns {Runtime} The {@link Runtime} instance, given the default runtime name
   */
  static ParseConfigDefaultRuntime(defaultRuntime, runtimeController) {
    if (defaultRuntime) {
      const defaultRuntimeInstance = runtimeController.getRuntime(defaultRuntime);
      if (!defaultRuntimeInstance) {
        throw new AntError(`Could not set default runtime: Runtime "${defaultRuntime}" was not found`);
      }
      return defaultRuntimeInstance;
    }
    return null;
  }

  /**
   * Returns the local configuration file path.
   *
   * @returns {String} The local configuration file path
   * @static
   * @private
   */
  static GetLocalConfigPath() {
    return path.resolve(process.cwd(), 'ant.yml');
  }

  /**
   * Returns the default Array of JSON handlers for a configuration file
   * @static
   */
  static get DefaultJSONHandlers() {
    return [
      new VariablesResolver(),
      new BasepathResolver(),
      new PluginsPathResolver(),
      new TemplatesPathResolver(),
      new FunctionsPathResolver(),
      new RuntimesPathResolver()
    ];
  }

  /**
   * Invokes the YAML.Document's toString.
   *
   * @returns {String} the String representing this configuration YAML document.
   */
  toString() {
    return this._config.toString();
  }
}
module.exports = Config;
