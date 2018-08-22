module.exports.run = function (event, context, callback) {
  try {
    const output = require(process.env.LIB)(event);
    if (output instanceof Promise) {
      output
        .then(data => callback(null, data))
        .catch(err => callback(err));
    } else {
      callback(null, output);
    }
  } catch (e) {
    callback(e);
  }
};
