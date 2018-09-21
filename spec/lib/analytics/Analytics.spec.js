/**
 * @fileoverview Tests for lib/analytics/Analytics.js file.
 */
jest.unmock('../../../lib/analytics/Analytics');
const Analytics = require('../../../lib/analytics/Analytics');
const Parse = require('parse/node');
const child_process = require('child_process');

describe('lib/analytics/Analytics.js', () => {
  test('should export "trackCommand" function', () => {
    expect(typeof Analytics.trackCommand).toBe('function');
  });

  describe('Analytics.spawnTrackingProcess', () => {
    const originalFork = child_process.fork;
    const unref = jest.fn();
    beforeEach(() => {
      child_process.fork = jest.fn().mockImplementation(() =>
        ({ unref })
      );
    });

    afterEach(() => {
      child_process.fork = originalFork;
    });

    test('should spawn the command_run tracking process', () => {
      const data = {
        foo: 'bar'
      };
      Analytics.spawnTrackingProcess(data);
      expect(child_process.fork).toHaveBeenCalledWith(
        expect.any(String),
        ['{"foo":"bar"}'],
        {
          detached: true,
          stdio: 'ignore'
        }
      );
      expect(unref).toHaveBeenCalledWith();
    });
  });

  describe('Analytics.trackCommand', () => {
    test('should track a command_run event', () => {
      const trackMock = jest.fn();
      Parse.Analytics.track = trackMock;
      Analytics.trackCommand();
      expect(trackMock).toHaveBeenCalledWith('command_run', {});
    });

    test('should track a command_run event with data', () => {
      const trackMock = jest.fn();
      Parse.Analytics.track = trackMock;
      const data = {
        number: 1,
        string: 'bar',
        123: 456,
        undefined: undefined,
        null: null,
        obj: {
          foo: 'bar'
        },
        list: [1, 'a', { foo: 'bar' }],
        func: () => {
          'bla';
        },
        '$0': 'unsupported'
      };
      Analytics.trackCommand(data);
      const expectedData = {
        'number': '1',
        'string': 'bar',
        '123': '456',
        'undefined': 'undefined',
        'null': 'null',
        'obj': '{"foo":"bar"}',
        'list': '[1,"a",{"foo":"bar"}]',
        'func': ''
      };
      expect(trackMock).toHaveBeenCalledWith('command_run', expectedData);
    });

    test('should not track if param data is unsupported', () => {
      try {
        Analytics.trackCommand(123);
      } catch (err) {
        expect(err.message).toBe('Param "data" must be an object');
      }
    });
  });
});
