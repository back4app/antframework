/**
 * @fileoverview Tests for lib/rxjsHelper.js file.
 */

const { Observable } = require('rxjs');
const { toArray } = require('rxjs/operators');
const rxjsHelper = require('../../lib/rxjsHelper');

describe('lib/rxjsHelper.js', () => {
  describe('rxjsHelper.createObservable', () => {
    let myObservable = null;

    test('should export createObservable function', () => {
      expect(rxjsHelper.createObservable).toEqual(expect.any(Function));
      let interval = null;
      let running = false;
      myObservable = rxjsHelper.createObservable(
        (next, error, complete) => {
          let i = 0;
          running = true;
          interval = setInterval(
            () => {
              if (running) {
                try {
                  next(++i);
                } catch (e) {
                  error(e);
                  clearInterval(interval);
                }
                if (i === 3) {
                  complete();
                  clearInterval(interval);
                }
              }
            },
            1000
          );
        },
        () => {
          running = false;
        },
        () => {
          running = true;
        }
      );
      expect(myObservable).toEqual(expect.any(Observable));
    });

    test('should start when received the first subscriber', async (done) => {
      expect.hasAssertions();
      const subscription1 = myObservable.subscribe(
        (data) => {
          expect(data).toEqual(1);
          subscription1.unsubscribe();
          done();
        }
      );
      const subscription2 = myObservable.subscribe(
        (data) => {
          expect(data).toEqual(1);
          subscription2.unsubscribe();
          done();
        }
      );
    });

    test('should complete', async () => {
      expect.hasAssertions();
      expect(await myObservable.pipe(toArray()).toPromise()).toEqual([1, 2, 3]);
    });

    test('should return even completed', async () => {
      expect.hasAssertions();
      expect(await myObservable.pipe(toArray()).toPromise()).toEqual([1, 2, 3]);
    });

    test('should send error', (done) => {
      const someError = new Error('Some error');
      expect.hasAssertions();
      const errorObservable = rxjsHelper
        .createObservable(
          (_, error) => {
            process.nextTick(() => error(someError));
          }
        );
      errorObservable
        .subscribe(
          () => {},
          err => {
            expect(err).toEqual(someError);
            errorObservable
              .subscribe(
                () => {},
                err => {
                  expect(err).toEqual(someError);
                  done();
                }
              );
          }
        );
    });
  });
});
