/**
 * @fileoverview Tests for lib/Analytics.js file.
 */
const Analytics = require('../lib/Analytics');
const Parse = require('parse/node');
const child_process = require('child_process');
const Sentry = require('@sentry/node');
const path = require('path');

describe('lib/analytics/Analytics.js', () => {
  const parseAppId = 'foo';
  const parseJsKey = 'bar';
  const parseServerUrl = 'lorem';
  const parseStorageFilePath = path.resolve(
    __dirname,
    './support/out/Analytics.js',
    'out' + Math.floor(Math.random() * 1000)
  );
  const sentryDsn = 'http://localhost';
  const config = { parseAppId, parseJsKey, parseServerUrl, parseStorageFilePath, sentryDsn };
  Sentry.init = jest.fn();
  const analytics = new Analytics();
  analytics.initialize(config);

  test('should export Analytics class', () => {
    expect(new Analytics().constructor.name).toBe('Analytics');
  });

  describe('Analytics.initialize', () => {
    test('should invoke Parse.initialize', () => {
      const parseInitMock = jest.spyOn(Parse, 'initialize');
      new Analytics().initialize({ parseAppId, parseJsKey, parseServerUrl, parseStorageFilePath });
      expect(parseInitMock).toHaveBeenCalledWith(parseAppId, parseJsKey);
    });

    test('should invoke Sentry.init', () => {
      const sentryInitMock = jest.fn();
      Sentry.init = sentryInitMock;
      const sentryDsn = 'foo';
      new Analytics().initialize({ sentryDsn });
      expect(sentryInitMock).toHaveBeenCalledWith({ dsn: sentryDsn });
    });
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

    test('should do nothing if Parse was not initialized', () => {
      const data = {
        foo: 'bar'
      };
      new Analytics().spawnTrackingProcess(data);
      expect(child_process.fork).not.toBeCalled();
    });

    test('should spawn the command_run tracking process', () => {
      Parse.applicationId = 'foo';
      const data = {
        foo: 'bar'
      };
      analytics.spawnTrackingProcess(data);
      expect(child_process.fork).toHaveBeenCalledWith(
        expect.any(String),
        ['{"foo":"bar"}', JSON.stringify(config) ],
        {
          detached: true,
          stdio: 'ignore'
        }
      );
      expect(unref).toHaveBeenCalledWith();
    });
  });

  describe('Analytics.trackCommand', () => {

    test('should do nothing if Parse was not initialized', async () => {
      const trackMock = jest.fn();
      Parse.Analytics.track = trackMock;
      await new Analytics().trackCommand();
      expect(trackMock).not.toBeCalled();
    });

    test('should track a command_run event', async () => {
      const trackMock = jest.fn();
      Parse.Analytics.track = trackMock;
      await analytics.trackCommand();
      expect(trackMock).toHaveBeenCalledWith('command_run', {});
    });

    test('should track a command_run event with data', async () => {
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
      await analytics.trackCommand(data);
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

    test('should not track if param data is unsupported', async () => {
      try {
        await analytics.trackCommand(123);
      } catch (err) {
        expect(err.message).toBe('Param "data" must be an object');
      }
    });
  });

  describe('Analytics.trackError', () => {
    test('should track an error', async () => {
      const closeMock = jest.fn(() => Promise.resolve());
      const getClientMock = jest.fn(() => {
        return {
          close: closeMock
        };
      });
      const getCurrentHubMock = jest.spyOn(Sentry, 'getCurrentHub').mockImplementation(() => {
        return {
          getClient: getClientMock
        };
      });
      const trackErrorMock = jest.spyOn(Sentry, 'captureException');
      const err = new Error('Mocked error');
      const trackingPromise = await analytics.trackError(err);
      expect(trackErrorMock).toHaveBeenCalledWith(err);
      expect(getCurrentHubMock).toHaveBeenCalledWith();
      expect(getClientMock).toHaveBeenCalledWith();
      expect(closeMock).toHaveBeenCalledWith(2000);
      expect(trackingPromise).toBeUndefined();
    });

    test('should return resolved promise when not initialized', async () => {
      const getCurrentHubMock = jest.spyOn(Sentry, 'getCurrentHub');
      const trackingPromise = await new Analytics().trackError();
      expect(getCurrentHubMock).not.toHaveBeenCalled();
      expect(trackingPromise).toBeUndefined();
    });
  });

  describe('Analytics.addBreadcrumb', () => {
    test('should do nothing if Sentry was not initialized', () => {
      const addBreadcrumbMock = jest.spyOn(Sentry, 'addBreadcrumb');
      new Analytics().addBreadcrumb();
      expect(addBreadcrumbMock).not.toBeCalled();
    });

    test('should add a breadcrumb', () => {
      const addBreadcrumbMock = jest.spyOn(Sentry, 'addBreadcrumb');
      const message = 'Hello world';
      const data = { my: 'data' };
      const category = 'My category';
      const level = 4;
      analytics.addBreadcrumb(message, data, category, level);
      expect(addBreadcrumbMock).toHaveBeenCalledWith({ message, data, category, level });
    });

    test('should use default values when undefined', () => {
      const addBreadcrumbMock = jest.spyOn(Sentry, 'addBreadcrumb');
      const category = 'Initialization';
      const level = 'info';
      analytics.addBreadcrumb();
      expect(addBreadcrumbMock).toHaveBeenCalledWith({
        message: undefined,
        data: undefined,
        category,
        level
      });
    });
  });
});
