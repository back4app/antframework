/**
 * @fileoverview Defines and exports the {@link AntStorageController}
 * class.
 */
const assert = require('assert');
const fs = require('fs-extra');

/**
 * The Ant's
 * [StorageController]{@link https://github.com/parse-community/Parse-SDK-JS/blob/master/src/StorageController.default.js}
 * implementation. It is needed in order to make Parse data to be persistent
 * across multiple Ant executions.
 */
class AntStorageController {
  /**
   * @param {!String} storageFilePath The storage file path
   */
  constructor (storageFilePath) {
    assert(storageFilePath, 'Parameter "storageFilePath" is required');
    assert(typeof storageFilePath === 'string', 'Parameter \
"storageFilePath" must be a String');
    this.storageFilePath = storageFilePath;
    fs.ensureFileSync(storageFilePath);
    const options = { throws: false, encoding: 'utf-8' };
    this.storage = fs.readJSONSync(storageFilePath, options) || {};
  }

  /**
   * Needed by Parse SDK.
   * Indicates it is an asynchronous controller.
   * @type {Number}
   */
  get async () {
    return 1;
  }

  /**
   * Retrieves a value from the storage, given a key.
   *
   * @param {String} key The key whose value will be retrieved
   * @returns {Any} The value associated with the key
   */
  async getItemAsync (key) {
    return this.storage[key];
  }

  /**
   * Sets an item into the storage.
   * If the item is already set with the same key,
   * does nothing.
   *
   * @param {String} key The entry key
   * @param {String} value The value to be set
   */
  async setItemAsync (key, value) {
    if (this.storage[key] === value) {
      return;
    }
    this.storage[key] = value;
    await this._writeStorage();
  }

  /**
   * Removes an item from the storage by its key.
   *
   * @param {String} key The key whose entry will be removed
   */
  async removeItemAsync (key) {
    if (!this.storage[key]) {
      return;
    }
    delete this.storage[key];
    await this._writeStorage();
  }

  /**
   * Writes the `this.storage` content into the storage file.
   */
  async _writeStorage () {
    await fs.writeJSON(this.storageFilePath, this.storage);
  }
}

module.exports = AntStorageController;
