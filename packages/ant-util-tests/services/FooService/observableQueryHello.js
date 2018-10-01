/**
 * @fileoverview Hello query function returning Observable for testing purposes.
 */

const { Observable } = require('@back4app/ant-util-rxjs/node_modules/rxjs');

module.exports = ({ name }) => {
  return Observable.create(
    subscriber => {
      subscriber.next(`Hello ${name} from function!!!`);
      subscriber.complete();
    }
  );
};
