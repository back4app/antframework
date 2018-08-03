/**
 * Exports util functions to help leading with the
 * [RxJS]{@link https://rxjs-dev.firebaseapp.com/api} API.
 * @module antframework/lib/util/rxjsHelper
 */

const assert = require('assert');
const { Observable } = require('rxjs');

/**
 * Helper function to create an
 * [Observable]{@link https://rxjs-dev.firebaseapp.com/api/index/class/Observable}
 * object.
 * @param {!Function} start The start function that will be used to start the
 * process that will be observed when the first subscriber arrives.
 * @param {Function} pause The pause function that can be used to pause the
 * process that is being observed when the last subscriber leaves.
 * @param {Function} resume The resume function that can be used to resume the
 * process that was paused when a new subscriber arrives.
 * @throws {AssertionError} If "start", "pause" or "resume" params are not
 * functions.
 * @return {Observable} The observable object.
 * @example
 * <caption>Creating an observable object</caption>
 * let interval = null;
 * let running = false;
 * const myObservable = createObservable(
 *   (next, error, complete) => {
 *     let i = 0;
 *     running = true;
 *     interval = setInterval(
 *       () => {
 *         if (running) {
 *           try {
 *             next(++i);
 *           } catch (e) {
 *             error(e);
 *             clearInterval(interval);
 *           }
 *           if (i === 10) {
 *             complete();
 *             clearInterval(interval);
 *           }
 *         }
 *       },
 *       1000
 *     );
 *   },
 *   () => {
 *     running = false;
 *   },
 *   () => {
 *     running = true;
 *   }
 * );
 * @example
 * <caption>Subscribing to an observable that was created</caption>
 * myObservable.subscribe(
 *   console.log,
 *   console.error,
 *   () => { console.log('completed'); }
 * );
 */
function createObservable(start, pause, resume) {
  assert(
    typeof start === 'function',
    'Observable could not be created: param "start" should be Function'
  );

  assert(
    !pause || typeof pause === 'function',
    'Observable could not be created: param "pause" should be Function'
  );

  assert(
    !resume || typeof resume === 'function',
    'Observable could not be created: param "resume" should be Function'
  );

  const buffer = [];
  let error = null;
  let running = true;
  let completed = false;
  const observers = new Set();

  start(
    (data) => {
      buffer.push(data);

      for (const observerItem of observers) {
        observerItem.next(data);
      }
    },
    (err) => {
      error = err;
      running = false;

      for (const observerItem of observers) {
        observerItem.error(err);
      }
    },
    () => {
      completed = true;
      running = false;

      for (const observerItem of observers) {
        observerItem.complete();
      }
    }
  );

  return Observable.create(observer => {
    observers.add(observer);

    for (const bufferItem of buffer) {
      observer.next(bufferItem);
    }

    if (error) {
      observer.error(error);
    } else if (completed) {
      observer.complete();
    } else if (!running && resume) {
      running = true;

      resume(buffer);
    }

    return () => {
      observers.delete(observer);

      if (!observers.size && !error && !completed && running && pause) {
        running = false;

        pause();
      }
    };
  });
}

module.exports.createObservable = createObservable;
