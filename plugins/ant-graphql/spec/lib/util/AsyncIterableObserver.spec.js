/* eslint-disable no-console */
/**
 * @fileoverview Tests for lib/util/AsyncIterableObserver.js file.
 */

const rxjs = require('rxjs');
const iterall = require('iterall');
const AsyncIterableObserver = require(
  '../../../lib/util/AsyncIterableObserver'
);

describe('lib/util/AsyncIterableObserver.js', () => {
  test('should export AsyncIterableObserver class', () => {
    expect(AsyncIterableObserver).toBeInstanceOf(Function);
    expect(new AsyncIterableObserver('foo', rxjs.of('foo')).constructor.name)
      .toBe('AsyncIterableObserver');
  });

  test('should iterate over resolved promise and finish', async () => {
    const observer = new AsyncIterableObserver('foo', rxjs.of(1, 2, 3));
    await iterall.forAwaitEach(observer, (data, index) => {
      expect(data).toEqual({
        foo: index + 1
      });
    });
    expect.hasAssertions();
  });

  test('should iterate over unresolved promise and finish', async () => {
    const observer = new AsyncIterableObserver('foo', rxjs.Observable.create(
      subscriber => {
        let i = 0;
        const interval = setInterval(
          () => {
            subscriber.next(`foo${++i}`);
            if (i >= 3) {
              subscriber.complete();
              clearInterval(interval);
            }
          },
          50
        );
        return () => {};
      }
    ));
    await iterall.forAwaitEach(observer, (data, index) => {
      expect(data).toEqual({
        foo: `foo${index + 1}`
      });
    });
    expect.hasAssertions();
  });

  test('should iterate over error', async () => {
    const observer = new AsyncIterableObserver('foo', rxjs.Observable.create(
      subscriber => {
        subscriber.error('error1');
        return () => {};
      }
    ));
    const iterator = iterall.createAsyncIterator(observer);
    expect(iterator.next()).resolves.toEqual({
      done: false,
      value: {
        foo: 'error1'
      }
    });
  });

  test('should iterate over unresolved error', async () => {
    const observer = new AsyncIterableObserver('foo', rxjs.Observable.create(
      subscriber => {
        setTimeout(() => {
          subscriber.error('error2');
        }, 50);
        return () => {};
      }
    ));
    const pendingPromise = observer.next();
    expect(observer._pendingResolves).toHaveLength(1);
    const result = await pendingPromise;
    expect(result).toEqual({
      value: {
        foo: 'error2'
      },
      done: false
    });
    expect(observer._pendingResolves).toHaveLength(0);
  });

  test('should iterate over unresolved completion', async () => {
    const observer = new AsyncIterableObserver('foo', rxjs.Observable.create(
      subscriber => {
        setTimeout(() => {
          subscriber.complete();
        }, 50);
        return () => {};
      }
    ));
    const pendingPromise = observer.next();
    expect(observer._pendingResolves).toHaveLength(1);
    const result = await pendingPromise;
    expect(result).toEqual({
      value: {
        foo: undefined
      },
      done: true
    });
    expect(observer._pendingResolves).toHaveLength(0);
  });

  test('should return async iterator', () => {
    const observer = new AsyncIterableObserver('foo', rxjs.of(1));
    expect(iterall.isAsyncIterable(observer)).toBeTruthy();
    const iterator = iterall.createAsyncIterator(observer);
    expect(iterator.next()).resolves.toEqual({
      value: {
        foo: 1
      },
      done: false
    });
    expect(iterator.next()).resolves.toEqual({
      value: {
        foo: undefined
      },
      done: true
    });
  });
});
