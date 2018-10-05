/**
 * @fileoverview Foo lib function for testing purposes.
 */

const { Observable } = require('rxjs');

module.exports = (count) => {
  return Observable.create(
    subscriber => {
      let i = 0;
      const interval = setInterval(
        () => {
          subscriber.next(++i);
          if (i >= count) {
            subscriber.complete();
            clearInterval(interval);
          }
        },
        1000
      );
      return () => {};
    }
  );
};
