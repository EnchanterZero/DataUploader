
class ImageSeries {

  constructor() {
    // extracted properties
    this._seriesInstanceUID = null;
    this._seriesNumber = -1;
    this._seriesDate = "";
    this._seriesTime = "";
    this._seriesDescription = "";
    this._modality = "";
    this._bodyPartExamined = "";
    this._rows = -1;
    this._columns = -1;
    this._frameTime = -1;

    // calculated value;
    this._sid = null;
    this._numberOfFrames = 0;
    this._numberOfChannels = 1;
    this._frames = [];
  }

  canMergeWith(series) {
    return this._sid !== null
      && utils.isEqual(this._sid, series._sid);
  }

  mergeWith(series) {
    if (this.canMergeWith(series)) {
      return false;
    }
    this._frames = this._frames.concat(series.frames);
    this._numberOfFrames += series.numberOfFrames;
  }

  slice() {

  }

  get seriesInstanceUID() {
    return this._seriesInstanceUID;
  }

  set seriesInstanceUID(val) {
    this._seriesInstanceUID = val;
  }

  get seriesNumber() {
    return this._seriesNumber;
  }

  set seriesNumber(val) {
    this._seriesNumber = val;
  }

  get seriesDate() {
    return this._seriesDate;
  }

  set seriesDate(val) {
    this._seriesDate = val;
  }

  get seriesTime() {
    return this._seriesTime;
  }

  set seriesTime(val) {
    this._seriesTime = val;
  }

  get seriesDescription() {
    return this._seriresDescription;
  }

  set seriesDescription(val) {
    this._seriresDescription = val;
  }

  get modality() {
    return this._modality;
  }

  set modality(val) {
    this._modality = val;
  }

  get bodyPartExamined() {
    return this._bodyPartExamined;
  }

  set bodyPartExamined(val) {
    this._bodyPartExamined = val;
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

  get frameTime() {
    return this._frameTime;
  }

  set frameTime(val) {
    this._frameTime = val;
  }

  get numberOfFrames() {
    return this._numberOfFrames;
  }

  set numberOfFrames(val) {
    this._numberOfFrames = val;
  }

  get numberOfChannels() {
    return this._numberOfChannels;
  }

  set numberOfChannels(val) {
    this._numberOfChannels = val;
  }

  get frames() {
    return this._frames;
  }
}

export default ImageSeries;
