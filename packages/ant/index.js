/**
 * Exports the {@link Ant} and the {@link Config} classes that can be used to
 * initialize and run the framework functionalities. It additionally exports the
 * following artifacts that can be used to extend the framework:
 * - The {@link AntFunction} class that can be used to create new functions.
 * - The {@link BinFunction} class that can be used to create new bin functions.
 * - The {@link Runtime} class that can be used to create new runtime functions.
 * - The {@link LibFunction} class that can be used to create new lib functions.
 * - The {@link Plugin} class that can be used to create new plugins.
 * - The {@link Template} class that can be used to create new templates.
 * - The {@link Provider} class that can be used to create new host providers to
 * deploy the functions.
 * - The {@link Host} class that can be used to create new hosts to deploy the
 * functions.
 * @module ant
 */

const Ant = require('./lib/Ant');
const Config = require('./lib/config/Config');
const AntFunction = require('./lib/functions/AntFunction');
const BinFunction = require('./lib/functions/BinFunction');
const Runtime = require('./lib/functions/runtimes/Runtime');
const LibFunction = require('./lib/functions/LibFunction');
const Plugin = require('./lib/plugins/Plugin');
const Template = require('./lib/templates/Template');
const Provider = require('./lib/hosts/providers/Provider');
const Host = require('./lib/hosts/Host');

module.exports = {
  Ant,
  Config,
  AntFunction,
  BinFunction,
  Runtime,
  LibFunction,
  Plugin,
  Template,
  Provider,
  Host
};
