/**
 * @fileoverview Tests for lib/Analytics.js file.
 */
const Analytics = require('../lib/Analytics');
const Parse = require('parse/node');
const child_process = require('child_process');
const Sentry = require('@sentry/node');

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

  describe('Analytics.trackError', () => {
    test('should track an error', () => {
      const trackErrorMock = jest.spyOn(Sentry, 'captureException');
      const err = new Error('Mocked error');
      const trackingPromise = Analytics.trackError(err);
      expect(trackErrorMock).toHaveBeenCalledWith(err);
      expect(trackingPromise).toBeDefined();
    });
  });

  describe('Analytics.addBreadcrumb', () => {
    test('should add a breadcrumb', () => {
      const addBreadcrumbMock = jest.spyOn(Sentry, 'addBreadcrumb');
      const message = 'Hello world';
      const data = { my: 'data' };
      const category = 'My category';
      const level = 4;
      Analytics.addBreadcrumb(message, data, category, level);
      expect(addBreadcrumbMock).toHaveBeenCalledWith({ message, data, category, level });
    });

    test('should use default values when undefined', () => {
      const addBreadcrumbMock = jest.spyOn(Sentry, 'addBreadcrumb');
      const category = 'Initialization';
      const level = 'info';
      Analytics.addBreadcrumb();
      expect(addBreadcrumbMock).toHaveBeenCalledWith({
        message: undefined,
        data: undefined,
        category,
        level
      });
    });
  });
});
