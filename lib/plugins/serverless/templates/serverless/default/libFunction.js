const lib = require(process.env.LIB);

module.exports.run = async (event) => {
  const output = lib(event);
  if (output instanceof Promise) {
    return await output;
  } else {
    return output;
  }
};
