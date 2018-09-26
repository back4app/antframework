/* eslint-disable no-unused-vars */

/**
 * @fileoverview Defines and exports the {@link ConfigJSONHandler} class.
 */

/**
 * Represents a generic JSON handler for the configuration files of Ant Framework.
 *
 * The main purpose of this class is to provide a way to pipe the JSON
 * built from the YAML document through a series of handlers, where each
 * handler will be responsible for processing and updating the JSON.
 * This way, it is possible to decentralize the logic needed in order to
 * prepare the JSON to be used inside the framework.
 */
class ConfigJSONHandler {
  /**
   * Every extension of this class should handle the JSON with its very
   * particular way. It is expected to be provided the configuration JSON
   * built from the YAML document tree.
   * It is also expected to be passed a second object, providing
   * additional data which might be useful during the processing of
   * the JSON.
   *
   * @param json The JSON built from the YAML document tree
   * @param params The additional parameters that will be available for
   * the handlers
   */
  handle(json, params) {}
}

module.exports = ConfigJSONHandler;
