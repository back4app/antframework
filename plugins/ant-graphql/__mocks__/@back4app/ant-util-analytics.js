/**
 * @fileoverview Manual mock required to avoid spawning
 * new processes which sends requests to the analytics
 * server during tests run.
 */
module.exports = {
  Analytics: {
    spawnTrackingProcess: () => {}
  }
};
