/**
 * @fileoverview Tests for lib/parse/AntStorageController.js file.
 */
const AntStorageController = require('../../lib/parse/AntStorageController');
const path = require('path');

const outPath = path.resolve(
  __dirname,
  '../support/out/parse/AntStorageController.js',
  'out' + Math.floor(Math.random() * 1000)
);

describe('lib/parse/AntStorageController.js', () => {
  test('should export AntStorageController class', () => {
    expect(new AntStorageController(getRandomStorageFile()).constructor.name)
      .toBe('AntStorageController');
  });

  test('should be an async controller', () => {
    expect(new AntStorageController(getRandomStorageFile()).async).toBe(1);
  });

  test('should implement StorageController functions', () => {
    const cont = new AntStorageController(getRandomStorageFile());
    expect(cont.getItemAsync).toBeInstanceOf(Function);
    expect(cont.setItemAsync).toBeInstanceOf(Function);
    expect(cont.removeItemAsync).toBeInstanceOf(Function);
  });

  describe('AntStorageController.setItemAsync', () => {
    test('should do nothing if entry is equal', async () => {
      const cont = new AntStorageController(getRandomStorageFile());
      await cont.setItemAsync('foo', 'bar');

      const writeStorageMock = jest.spyOn(AntStorageController.prototype, '_writeStorage');
      await cont.setItemAsync('foo', 'bar');
      expect(writeStorageMock).not.toBeCalled();
    });

    test('should set an item', async () => {
      const cont = new AntStorageController(getRandomStorageFile());
      await cont.setItemAsync('foo', 'bar');
      expect(await cont.getItemAsync('foo')).toBe('bar');
    });
  });

  describe('AntStorageController.removeItemAsync', () => {
    test('should do nothing if does not contains key', async () => {
      const writeStorageMock = jest.spyOn(AntStorageController.prototype, '_writeStorage');
      const cont = new AntStorageController(getRandomStorageFile());
      await cont.removeItemAsync('foo');
      expect(writeStorageMock).not.toBeCalled();
    });

    test('should remove an item', async () => {
      const cont = new AntStorageController(getRandomStorageFile());
      await cont.setItemAsync('foo', 'bar');

      const writeStorageMock = jest.spyOn(AntStorageController.prototype, '_writeStorage');
      await cont.removeItemAsync('foo');
      expect(await cont.getItemAsync('foo')).toBeUndefined();
      expect(writeStorageMock).toBeCalledWith();
    });
  });
});

function getRandomStorageFile() {
  return path.resolve(outPath, Math.floor(Math.random() * 1000).toString());
}
