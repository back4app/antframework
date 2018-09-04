const assert = require('assert');
const { Observable } = require('rxjs');

class AsyncIterableObserver {
  constructor(field, observable) {
    assert(typeof field === 'string' && field.length > 0, 'Param "field" \
must be a non-empty String');
    assert(observable && observable instanceof Observable, 'Param "observable" \
must be an instance of Observable');
    this._fieldName = field;
    this._pendingResolves = [];
    this._resolvedPromises = [];
    this._done = false;

    observable.subscribe(
      data => {
        this._resolvePromise(data);
      },
      err => {
        this._resolvePromise(err);
      },
      () => {
        this._done = true;
        this._resolvePromise();
      }
    );
  }

  /**
   * Returns a Promise which resolves into the next value published
   * by the Observable, formatted following the Iterable pattern.
   *
   * @example <caption>The resolved Promise when the Observable is not yet completed</caption>
   * {
   *   value: {
   *     foo: 'bar'
   *   },
   *   done: false
   * }
   *
   * @example <caption>The resolved Promise when the Observable is completed</caption>
   * {
   *   value: {
   *     foo: undefined
   *   },
   *   done: true
   * }
   *
   * @returns {Promise<Object>} a Promise that will be resolved when
   * any data or error from the Observable arrives; or a
   * resolved Promise with the Observable data that was already
   * received in a past moment and cached by the internal subscriber.
   */
  next () {
    if (this._resolvedPromises.length) {
      return this._resolvedPromises.shift();
    }
    return new Promise(resolve => {
      this._pendingResolves.push(resolve);
    });
  }

  /**
   * Given the data provided by the Observable, it creates
   * a response following the Iterable pattern, and resolves
   * the least recent pending Promise (if any exists) or pushes
   * a resolved Promise into the `resolvedPromises` array.
   *
   * @param {Any} data Any data provided by the observable
   */
  _resolvePromise(data) {
    const value = {};
    value[this._fieldName] = data;

    /**
     * The response must follow this pattern:
     * {
     *   value: {
     *     <fieldName>: <data>
     *   },
     *   done: <true|false>
     * }
     */
    const response = {
      value,
      done: this._done
    };
    if (this._pendingResolves.length) {
      this._pendingResolves.shift()(response);
    } else {
      this._resolvedPromises.push(Promise.resolve(response));
    }
  }

  /**
   * Implements the AsyncIterable protocol and returns a new instance
   * of iterator. Typically the `Symbol.asyncIterator` is used to
   * return an iterator, but `@@asyncIterator` is used as a fallback,
   * and it is also considered when creating iterators using `iterall` lib.
   *
   * @returns {Object} the subscriber values iterator
   */
  '@@asyncIterator' () {
    const self = this;
    return {
      next: () => self.next()
    };
  }
}

module.exports = AsyncIterableObserver;
