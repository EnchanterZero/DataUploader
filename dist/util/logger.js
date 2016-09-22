"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const loglevel = require("loglevel");
loglevel.setDefaultLevel('trace');

const ld = loglevel.getLogger("default");
const assert_ = require('assert');

function err(msg) {
  ld.error(msg);
  throw new Error(msg);
}

function assertDebug() {
  assert_(...arguments);
}

function assertRelease() {}

const assert = true ? assertDebug : assertRelease; // eslint-disable-line
const error = true ? err : ld.error; // eslint-disable-line

const logger = {
  assert: assert,
  error: err,
  getLogger: loglevel.getLogger,
  trace: ld.trace,
  debug: ld.debug,
  warn: ld.warn,
  info: ld.info,
  log: ld.info
};

exports.logger = logger;