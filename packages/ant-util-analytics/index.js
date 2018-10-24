/**
 * @fileoverview The analytics module, which is responsible
 * for tracking the framework usage and any errors thrown
 * during its execution, in order to trace and solve any
 * bugs found as soon as possible.
 *
 * @module ant-util-analytics
 */
const Analytics = new (require('./lib/Analytics'))();

module.exports = { Analytics };
