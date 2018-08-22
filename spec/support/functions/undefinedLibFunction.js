/**
 * @fileoverview undefined lib function for testing purposes.
 */

const { Observable } = require('rxjs');

module.exports = () => {
  return Observable.create(
    subscriber => {
      subscriber.next(undefined);
      subscriber.complete();
      return () => {};
    }
  );
};
