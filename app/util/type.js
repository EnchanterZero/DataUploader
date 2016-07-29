
const _ = require('lodash');

const type = {
  isArrayBuffer(a) {
    return a && a instanceof ArrayBuffer;
  },

  isTypedArray(a) {
    return a && a.buffer && a.buffer instanceof ArrayBuffer;
  },

  isVec3(v) {
    return v && _.isArrayLike(v) && v.length === 3 && typeof v[0] === 'number';
  },

  isVec3Array(a) {
    return a && a instanceof Array && a.length > 0 && this.isVec3(a[0]);
  },

  isPromise(obj) {
    return obj && obj instanceof Promise;
  },

  isImage(obj) {
    return obj && (obj instanceof HTMLImageElement ||
                   obj instanceof Image ||
                   obj instanceof HTMLCanvasElement);
  },

  isBlob(obj) {
    return obj && obj instanceof Blob;
  },
};

export default type;
