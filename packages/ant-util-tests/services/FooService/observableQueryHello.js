/**
 * @fileoverview Hello query function returning Observable for testing purposes.
 */

const { Observable } = require('rxjs');

module.exports = ({ name }) => {
  return Observable.create(
    subscriber => {
      subscriber.next(`Hello ${name} from function!!!`);
      subscriber.complete();
    }
  );
};
