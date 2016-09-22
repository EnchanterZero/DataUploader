'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const _ = require('lodash');

const type = {
  isArrayBuffer: function isArrayBuffer(a) {
    return a && a instanceof ArrayBuffer;
  },
  isTypedArray: function isTypedArray(a) {
    return a && a.buffer && a.buffer instanceof ArrayBuffer;
  },
  isVec3: function isVec3(v) {
    return v && _.isArrayLike(v) && v.length === 3 && typeof v[0] === 'number';
  },
  isVec3Array: function isVec3Array(a) {
    return a && a instanceof Array && a.length > 0 && this.isVec3(a[0]);
  },
  isPromise: function isPromise(obj) {
    return obj && obj instanceof Promise;
  },
  isImage: function isImage(obj) {
    return obj && (obj instanceof HTMLImageElement || obj instanceof Image || obj instanceof HTMLCanvasElement);
  },
  isBlob: function isBlob(obj) {
    return obj && obj instanceof Blob;
  }
};

exports.default = type;