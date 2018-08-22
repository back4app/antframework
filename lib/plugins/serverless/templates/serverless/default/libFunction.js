const lib = require(process.env.LIB);

module.exports.run = function (event, context, callback) {
  try {
    const output = lib(event);
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
