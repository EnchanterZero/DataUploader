
class ImageFrame {

  constructor() {
    // extracted properties
    this._sopInstanceUID = null;
    this._instanceNumber = -1;
    this._rows = 0;
    this._columns = 0;
    this._pixelType = 0;
    this._pixelSpacing = null;
    this._pixelAspectRatio = null;
    this._windowCenter = null;
    this._windowWidth = null;
    this._rescaleSlope = null;
    this._rescaleIntercept = null;
    this._bitsAllocated = 8;

    // calculated value;
    this._pixelArrayConstructor = null;
    this._pixels = null;
  }

  get sopInstanceUID() {
    return this._sopInstanceUID;
  }

  set sopInstanceUID(val) {
    this._sopInstanceUID = val;
  }

  get instanceNumber() {
    return this._instanceNumber;
  }

  set instanceNumber(val) {
    this._instanceNumber = val;
  }

  get rows() {
    return this._rows;
  }

  set rows(val) {
    this._rows = val;
  }

  get columns() {
    return this._columns;
  }

  set columns(val) {
    this._columns = val;
  }

  get pixelType() {
    return this._pixelType;
  }

  set pixelType(val) {
    this._pixelType = val;
  }

  get pixelSpacing() {
    return this._pixelSpacing;
  }

  set pixelSpacing(val) {
    this._pixelSpacing = val;
  }

  get pixelAspectRatio() {
    return this._pixelAspectRatio;
  }

  set pixelAspectRatio(val) {
    this._pixelAspectRatio = val;
  }

  get windowCenter() {
    return this._windowCenter;
  }

  set windowCenter(val) {
    this._windowCenter = val;
  }

  get windowWidth() {
    return this._windowWidth;
  }

  set windowWidth(val) {
    this._windowWidth = val;
  }

  get rescaleSlope() {
    return this._rescaleSlope;
  }

  set rescaleSlope(val) {
    this._rescaleSlope = val;
  }

  get rescaleIntercept() {
    return this._rescaleIntercept;
  }

  set rescaleIntercept(val) {
    this._rescaleIntercept = val;
  }

  get bitsAllocated() {
    return this._bitsAllocated;
  }

  set bitsAllocated(val) {
    this._bitsAllocated = val;
  }

  get pixelArrayConstructor() {
    return this._pixelArrayConstructor;
  }

  set pixelArrayConstructor(val) {
    this._pixelArrayConstructor = val;
  }

  get pixels() {
    return this._pixels;
  }

  set pixels(val) {
    this._pixels = val;
  }

}

export default ImageFrame;
