
const assert = require('assert');
const Jpeg = require('jpeg-lossless-decoder-js');
const JpegBaseline = require('../../../external/jpeg/jpeg');
const Jpx = require('../../../external/jpeg/jpx');

import { DataStream } from '../../../modules/file';
import Parser from '../Parser';
import DicomTags from './DicomTags';
const parser = require('./parser');

import { util } from '../../../util';
const logger = util.logger.getLogger('dicom');

const maxElementValueLength = 1024;

function isStringVR(vr) {
  return vr &&
    (vr === 'AE' || vr === 'AS' || vr === 'CS' || vr === 'DA' || vr === 'DT' || vr === 'DS'
     || vr === 'IS' || vr === 'LO' || vr === 'LT' || vr === 'PN' || vr === 'SH' || vr === 'ST'
     || vr === 'TM' || vr === 'UI' || vr === 'UT');
}

function readNumbers(dataSet, element, reader, byteSize, vm) {
  function readNumbersArray(count) {
    const items = [];
    for (let i = 0; i < count; ++i) {
      items.push(reader.call(dataSet, element.tag, i));
    }
    return items;
  }

  function readNumbersArrayString() {
    // try to decode as string
    const str = dataSet.string(element.tag);
    const values = str.split('\\').map(Number);
    if (util.findIndex(values, isNaN) === -1) {
      return values;
    }
    logger.warn(`Parse tag '${element}', '${str}' as number string failed.`);
    return null;
  }

  if (Number.isInteger(vm)) {
    if (element.length === byteSize * vm) {
      if (vm === 1) {
        return reader.call(dataSet, element.tag);
      } else {
        return readNumbersArray(vm);
      }
    } else {
      return readNumbersArrayString();
    }
  } else {
    let [min, max] = vm.split('-');
    const hasWildcard = max[max.length - 1] === 'n';
    min = parseInt(min);
    max = max === 'n' ? Infinity : parseInt(max);
    const cnt = (element.length / byteSize) | 0;
    if (min <= cnt && cnt <= max && (!hasWildcard || cnt % min === 0)) {
      return readNumbersArray(cnt);
    } else {
      return readNumbersArrayString();
    }
  }
}

function swap16(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i];
    arr[i] = ((item & 0xff) << 8) | ((item & 0xff00) >> 8);
  }
}

function convertToReadableData(dataSet, element, tag, isLittleEndian) {
  if (element.length === 0) {
    return null;
  }

  const propertyName = element.tag;
  let vr = element.vr;
  if (vr === undefined) {
    vr = tag && tag.vr;
    if (vr) {
      vr = vr.split('|')[0];
    }
  }
  const vm = (tag && tag.vm) || 1;

  if (vr === 'US') {
    return readNumbers(dataSet, element, dataSet.uint16, 2, vm);
  } else if (vr === 'SS') {
    return readNumbers(dataSet, element, dataSet.int16, 2, vm);
  } else if (vr === 'UL') {
    return readNumbers(dataSet, element, dataSet.uint32, 4, vm);
  } else if (vr === 'SL') {
    return readNumbers(dataSet, element, dataSet.int32, 4, vm);
  } else if (vr === 'FD') {
    return readNumbers(dataSet, element, dataSet.double, 8, vm);
  } else if (vr === 'FL') {
    return readNumbers(dataSet, element, dataSet.float, 4, vm);
  } else if (vr === 'OW') {
    const value = new Uint16Array(dataSet.byteArray.buffer, element.dataOffset, element.length / 2).slice();
    if (!isLittleEndian) {
      swap16(value);
    }
    return value;
  } else if (vr === 'AT') {
    const groupNumber = dataSet.uint16(propertyName, 0);
    const groupHexStr = ("0000" + groupNumber.toString(16)).substr(-4);
    const elementNumber = dataSet.uint16(propertyName, 1);
    const elementHexStr = ("0000" + elementNumber.toString(16)).substr(-4);
    return "x" + groupHexStr + elementHexStr;
  } else if (isStringVR(vr)) {
    const str = dataSet.string(propertyName);
    if (util.string.isASCII(str)) {
      return str;
    }
    const array = new Uint8Array(dataSet.byteArray.buffer, element.dataOffset, element.length);
    return util.string.convertByteArrayToString(array, 'GBK');
  }

  // For other VR just return an array.
  return new Uint8Array(dataSet.byteArray.buffer, element.dataOffset, element.length);
}

function dataSetProperty2JSON(dataSet, propertyName, isLittleEndian) {
  const element = dataSet.elements[propertyName];
  const tag = DicomTags.find(element.tag);
  const obj = {};
  obj.name = tag && tag.name;
  obj.tag = element.tag;
  obj.length = element.hadUndefinedLength ? -1 : element.length;
  obj.vr = element.vr;

  if (element.items) {
    obj.value = element.items.map(function(item) {
      return dataSet2JSON(item.dataSet, isLittleEndian);
    });
  } else if (element.fragments) {
    obj.value = element.fragments.map(function (fragments, index) {
      return parser.readEncapsulatedPixelData(dataSet, element, index);
    });
  } else {
    obj.value = convertToReadableData(dataSet, element, tag, isLittleEndian);
  }
  return obj;
}

function dataSet2JSON(dataSet, isLittleEndian) {
  const json = {};
  let little = isLittleEndian;
  if (little === undefined) {
    const transferSyntax = dataSet.string('x00020010');
    little = transferSyntax !== '1.2.840.10008.1.2.2';
  }
  for (let propertyName in dataSet.elements) {
    const obj = dataSetProperty2JSON(dataSet, propertyName, little);
    json[obj.name || obj.tag] = obj.value;
  }
  return json;
}

class DicomParser extends Parser {

  constructor(stream) {
    super();
    this._buffer = stream.buffer.slice(stream.byteOffset);
  }

  static match(stream) {
    let isDicom = false;
    const position = stream.position;
    if ((stream.byteLength - position) > (128 + 4)) {
      stream.seek(position + 128);
      isDicom = stream.readString(4) === 'DICM';
      stream.seek(position);
    }
    if (!isDicom && (stream.byteLength - position) > (128 + 4 + 4)) {
      const group = stream.readUint16() << 16;
      const element = stream.readUint16();
      const tagName = util.padStart((group | element).toString(16), 8, '0');
      const tag = DicomTags.find(`x${tagName}`);
      isDicom = !!(tag);
      stream.seek(position);
    }
    return isDicom;
  }

  parse() {
    const byteArray = new Uint8Array(this._buffer);
    let dataSet;
    try {
      dataSet = parser.parseDicom(byteArray, {});
    } catch (err) {
      logger.debug('not a dicom file.', err);
      return Promise.reject(err);
    }
    return this.init(dataSet);
  }

  init(dataSet) {
    this._metadata = dataSet2JSON(dataSet);
    this._metadata._dataSet = dataSet;
    this.checkMediaStorageSOPClassUID();
    return Promise.resolve(this);
  }

  metadata() {
    return this._metadata;
  }

  checkMediaStorageSOPClassUID(json) {
    const uid = this._metadata.MediaStorageSOPClassUID && this._metadata.MediaStorageSOPClassUID.data;
    if (uid === '1.2.840.10008.1.3.10') {
      throw new Error('Media Storage Directory Storage is not support now.');
    }
  }

  extractPixels(frameIndex) {
    const transferSyntaxUID = this.valueOf('TransferSyntaxUID');
    // find compression scheme
    if (transferSyntaxUID === '1.2.840.10008.1.2.4.90' || // JPEG 2000 Lossless
        transferSyntaxUID === '1.2.840.10008.1.2.4.91') { // JPEG 2000 Lossy
      // JPEG 2000
      return this.decodeJ2K(frameIndex);
    } else if (transferSyntaxUID === '1.2.840.10008.1.2.4.57' || // JPEG Lossless, Nonhierarchical (Processes 14)
       transferSyntaxUID === '1.2.840.10008.1.2.4.70') {       // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
      // JPEG LOSSLESS
      return this.decodeJPEGLossless(frameIndex);
    } else if (transferSyntaxUID === '1.2.840.10008.1.2.4.50' || // JPEG Baseline lossy process 1 (8 bit)
      transferSyntaxUID === '1.2.840.10008.1.2.4.51') {        // JPEG Baseline lossy process 2 & 4 (12 bit)
      // JPEG Baseline
      return this.decodeJPEGBaseline(frameIndex);
    } else if (transferSyntaxUID === null ||
      transferSyntaxUID === '1.2.840.10008.1.2' || // Implicit VR Little Endian
      transferSyntaxUID === '1.2.840.10008.1.2.1' ||     // Explicit VR Little Endian
      transferSyntaxUID === '1.2.840.10008.1.2.2') {      // Explicit VR Big Endian
      const data = this.decodeUncompressed(frameIndex);
      return this.convertColorSpace(data);
    } else if (transferSyntaxUID === '1.2.840.10008.1.2.5') {
      const data = this.decodeRLE(frameIndex);
      return this.convertColorSpace(data);
    } else {
      throw `no decoder for transfer syntax ${transferSyntaxUID}`;
    }
  }

  readPixelData(frameIndex) {
    const data = this.valueOf('PixelData');
    if (data instanceof Array) {
      return data[frameIndex];
    } else {
      const photometricInterpretation = this.photometricInterpretation();
      let numPixels = this.rows(frameIndex) * this.columns(frameIndex);
      if (photometricInterpretation !== 'PALETTE COLOR') {
        const numberOfChannels = this.numberOfChannels();
        numPixels = numPixels * numberOfChannels;
      }
      const bitsAllocated = this.bitsAllocated();
      let frameSize = numPixels;
      if (bitsAllocated === 16 && !(data instanceof Uint16Array)) {
        frameSize *= 2;
      }
      return data.slice(frameSize * frameIndex, frameSize * (frameIndex + 1));
    }
  }

  decodeRLE(frameIndex) {
    function rleDecode(stream, out, inmax, outmax) {
      while (stream.position < inmax && out.position < outmax) {
        let byte = stream.readInt8();
        if (byte >= 0) {
          let count = byte + 1;
          while (count-- > 0) {
            out.writeInt8(stream.readInt8());
          }
        } else if( byte <= -1 && byte >= -127 ) {
          let nextByte = stream.readInt8();
          let count2 = -byte + 1;
          while (count2-- > 0) {
            out.writeInt8(nextByte);
          }
        } else {
          assert(false);
        }
      }
    }

    const bitsAllocated = this.bitsAllocated();
    const pixelSize = (bitsAllocated / 8) | 0;
    let frameSize = this.rows() * this.columns() * pixelSize;
    if (this.photometricInterpretation() != 'PALETTE COLOR') {
      frameSize *= this.numberOfChannels();
    }
    const out = new DataStream(new ArrayBuffer(frameSize));
    const encoded = this.readPixelData(frameIndex);
    const stream = new DataStream(encoded.buffer, encoded.byteOffset);
    const position = stream.position;
    const numSegment = stream.readInt32();
    for (let i = 0; i < numSegment; ++ i) {
      stream.seek(position + 4 + 8 * i);
      const offset = stream.readInt32();
      let end = stream.readInt32();
      if (end === 0) {
        end = stream.byteLength - stream.position;
      }
      stream.seek(position + offset);
      rleDecode(stream, out, stream.position + end, frameSize);
    }

    const pixelRepresentation = this.pixelRepresentation();
    if (pixelRepresentation === 0 && bitsAllocated === 8) {
      return new Uint8Array(out.buffer);
    } else if (pixelRepresentation === 0 && bitsAllocated === 16) {
      return new Uint16Array(out.buffer);
    } else if (pixelRepresentation === 1 && bitsAllocated === 16) {
      return new Int16Array(out.buffer);
    }
    return null;
  }

  decodeJ2K(frameIndex = 0) {
    const encodedPixelData = this.readPixelData(frameIndex);
    const jpxImage = new Jpx();
    // https://github.com/OHIF/image-JPEG2000/issues/6
    // It currently returns either Int16 or Uint16 based on whether the codestream is signed or not.
    jpxImage.parse(encodedPixelData);

    const componentsCount = jpxImage.componentsCount;
    if (componentsCount !== 1) {
      throw `JPEG2000 decoder returned a componentCount of ${componentsCount}, when 1 is expected`;
    }
    const tileCount = jpxImage.tiles.length;
    if (tileCount !== 1) {
      throw `JPEG2000 decoder returned a tileCount of ${tileCount}, when 1 is expected`;
    }
    const tileComponents = jpxImage.tiles[0];
    const pixelData = tileComponents.items;
    return pixelData;
  }

  // from cornerstone & ami
  decodeJPEGLossless(frameIndex = 0) {
    let encodedPixelData = this.readPixelData(frameIndex);
    let pixelRepresentation = this.pixelRepresentation();
    let bitsAllocated = this.bitsAllocated();
    let byteOutput = bitsAllocated <= 8 ? 1 : 2;
    let decoder = new Jpeg.lossless.Decoder();
    let decompressedData = decoder.decode(encodedPixelData.buffer, encodedPixelData.byteOffset, encodedPixelData.length, byteOutput);
    if (pixelRepresentation === 0) {
      if (byteOutput === 2) {
        return new Uint16Array(decompressedData.buffer);
      } else {
        // untested!
        return new Uint8Array(decompressedData.buffer);
      }
    } else {
      return new Int16Array(decompressedData.buffer);
    }
  }

  decodeJPEGBaseline(frameIndex = 0) {
    const encodedPixelData = this.readPixelData(frameIndex);
    const rows = this.rows();
    const columns = this.columns();
    const bitsAllocated = this.bitsAllocated();
    const jpegBaseline = new JpegBaseline();
    jpegBaseline.parse(encodedPixelData);
    if (bitsAllocated === 8) {
      return jpegBaseline.getData(columns, rows);
    } else if (bitsAllocated === 16) {
      return jpegBaseline.getData16(columns, rows);
    }
  }

  decodeUncompressed(frameIndex = 0) {
    let pixelRepresentation = this.pixelRepresentation();
    let bitsAllocated = this.bitsAllocated();
    let pixelDataOffset = 0;
    let numberOfChannels = this.numberOfChannels();
    let photometricInterpretation = this.photometricInterpretation();
    let numPixels = this.rows(frameIndex) * this.columns(frameIndex);
    if (photometricInterpretation !== 'PALETTE COLOR') {
      numPixels = numPixels * numberOfChannels;
    }
    let frameOffset = 0;
    let buffer = this.readPixelData(frameIndex).buffer;

    if (pixelRepresentation === 0 && bitsAllocated === 8) {

      // unsigned 8 bit
      // frameOffset = pixelDataOffset + frameIndex * numPixels;
      return new Uint8Array(buffer, frameOffset, numPixels);

    } else if (pixelRepresentation === 0 && bitsAllocated === 12) {

      // unsigned 12 bit
      const frameSize = (numPixels * 3) >> 1;
      // frameOffset = pixelDataOffset + frameIndex * frameSize;
      const src = new Uint8Array(buffer, frameOffset, frameSize);
      const dst = new Uint16Array(numPixels);
      let j = 0;
      for (let i = 0; i < numPixels; ++i) {
        dst[i] = src[j] + (src[j + 1] << 4) + (src[j + 2] << 8);
        j += 3;
      }
      return dst;

    } else if (pixelRepresentation === 0 && bitsAllocated === 16) {

      // unsigned 16 bit
      // frameOffset = pixelDataOffset + frameIndex * numPixels * 2;
      return new Uint16Array(buffer, frameOffset, numPixels);

    } else if (pixelRepresentation === 1 && bitsAllocated === 16) {

      // signed 16 bit
      // frameOffset = pixelDataOffset + frameIndex * numPixels * 2;
      return new Int16Array(buffer, frameOffset, numPixels);

    } else if (pixelRepresentation === 0 && bitsAllocated === 32) {

      // unsigned 32 bit
      // frameOffset = pixelDataOffset + frameIndex * numPixels * 4;
      return new Uint32Array(buffer, frameOffset, numPixels);

    } else if (pixelRepresentation === 0 && bitsAllocated === 1) {
      const newBuffer = new ArrayBuffer(numPixels);
      const newArray = new Uint8Array(newBuffer);

      // frameOffset = pixelDataOffset + frameIndex * numPixels;
      let index = 0;

      let bitStart = frameIndex * numPixels;
      let bitEnd   = frameIndex * numPixels + numPixels;

      let byteStart = Math.floor( bitStart / 8);
      let bitStartOffset = bitStart - byteStart * 8;
      let byteEnd = Math.ceil( bitEnd/8 );

      let targetBuffer = new Uint8Array(buffer, pixelDataOffset);

      for(let i = byteStart; i<=byteEnd; i++){
        while(bitStartOffset < 8){

          switch(bitStartOffset){
            case 0:
              newArray[index] = targetBuffer[i] & 0x0001;
              break;
            case 1:
              newArray[index] = targetBuffer[i] >>> 1 & 0x0001;
              break;
            case 2:
              newArray[index] = targetBuffer[i] >>> 2 & 0x0001;
              break;
            case 3:
              newArray[index] = targetBuffer[i] >>> 3 & 0x0001;
              break;
            case 4:
              newArray[index] = targetBuffer[i] >>> 4 & 0x0001;
              break;
            case 5:
              newArray[index] = targetBuffer[i] >>> 5 & 0x0001;
              break;
            case 6:
              newArray[index] = targetBuffer[i] >>> 6 & 0x0001;
              break;
            case 7:
              newArray[index] = targetBuffer[i] >>> 7 & 0x0001;
              break;
            default:
              break;
          }

          bitStartOffset++;
          index++;
          // if return..
          if(index >= numPixels){
            return newArray;
          }
        }
        bitStartOffset = 0;

      }
    }
  }

  convertColorSpace(uncompressedData) {
    let rgbData = null;
    let photometricInterpretation = this.photometricInterpretation();
    let planarConfiguration = this.planarConfiguration();

    if (photometricInterpretation === 'RGB' &&
        planarConfiguration === 0) {
      // ALL GOOD, ALREADY ORDERED
      // planar or non planar planarConfiguration
      rgbData = uncompressedData;
    } else if (photometricInterpretation === 'RGB' &&
        planarConfiguration === 1) {
      if (uncompressedData instanceof Int8Array) {
        rgbData = new Int8Array(uncompressedData.length);
      } else if (uncompressedData instanceof Uint8Array) {
        rgbData = new Uint8Array(uncompressedData.length);
      } else if (uncompressedData instanceof Int16Array) {
        rgbData = new Int16Array(uncompressedData.length);
      } else if (uncompressedData instanceof Uint16Array) {
        rgbData = new Uint16Array(uncompressedData.length);
      } else {
        throw `unsuported typed array: ${uncompressedData}`;
      }

      const numPixels = uncompressedData.length / 3;
      let rgbaIndex = 0;
      let rIndex = 0;
      let gIndex = numPixels;
      let bIndex = numPixels * 2;
      for (let i = 0; i < numPixels; i++) {
        rgbData[rgbaIndex++] = uncompressedData[rIndex++]; // red
        rgbData[rgbaIndex++] = uncompressedData[gIndex++]; // green
        rgbData[rgbaIndex++] = uncompressedData[bIndex++]; // blue
      }
    } else if (photometricInterpretation === 'YBR_FULL') {
      if (uncompressedData instanceof Int8Array) {
        rgbData = new Int8Array(uncompressedData.length);
      } else if (uncompressedData instanceof Uint8Array) {
        rgbData = new Uint8Array(uncompressedData.length);
      } else if (uncompressedData instanceof Int16Array) {
        rgbData = new Int16Array(uncompressedData.length);
      } else if (uncompressedData instanceof Uint16Array) {
        rgbData = new Uint16Array(uncompressedData.length);
      } else {
        throw `unsuported typed array: ${uncompressedData}`;
      }

      // https://github.com/chafey/cornerstoneWADOImageLoader/blob/master/src/decodeYBRFull.js
      let nPixels = uncompressedData.length / 3;
      let ybrIndex = 0;
      let rgbaIndex = 0;
      for (let i = 0; i < nPixels; i++) {
        let y = uncompressedData[ybrIndex++];
        let cb = uncompressedData[ybrIndex++];
        let cr = uncompressedData[ybrIndex++];
        rgbData[rgbaIndex++] = y + 1.40200 * (cr - 128);// red
        rgbData[rgbaIndex++] = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128); // green
        rgbData[rgbaIndex++] = y + 1.77200 * (cb - 128); // blue
        // rgbData[rgbaIndex++] = 255; //alpha
      }
    } else if (photometricInterpretation === 'PALETTE COLOR') {
      // Account for zero-values for the lookup table length
      //
      // "The first Palette Color Lookup Table Descriptor value is the number of entries in the lookup table.
      //  When the number of table entries is equal to 2^16 then this value shall be 0."
      //
      // See: http://dicom.nema.org/MEDICAL/Dicom/2015c/output/chtml/part03/sect_C.7.6.3.html#sect_C.7.6.3.1.5
      const desc = this.valueOf('RedPaletteColorLookupTableDescriptor');
      let len = desc[0];
      if (!len) {
        len = 65536;
      }

      const start = desc[1];
      const bits = desc[2];
      const shift = (bits === 16 ? 8 : 0 );

      const rData = this.valueOf('RedPaletteColorLookupTableData');
      const bData = this.valueOf('BluePaletteColorLookupTableData');
      const gData = this.valueOf('GreenPaletteColorLookupTableData');

      const numPixels = uncompressedData.length;
      rgbData = new Uint8Array(numPixels * 3);
      let palIndex = 0;
      let rgbaIndex = 0;

      for(let i = 0 ; i < numPixels ; ++i) {
        var value = uncompressedData[palIndex++];
        if (value < start)
          value = 0;
        else if (value > start + len -1)
          value = len - 1;
        else
          value = value - start;

        rgbData[ rgbaIndex++ ] = rData[value] >> shift;
        rgbData[ rgbaIndex++ ] = gData[value] >> shift;
        rgbData[ rgbaIndex++ ] = bData[value] >> shift;
        //rgbData[ rgbaIndex++ ] = 255;
      }
    } else {
      // throw `photometric interpolation not supported: ${photometricInterpretation}`;
      rgbData = uncompressedData;
    }

    return rgbData;
  }

  pixelData(frame) {
    return this.extractPixels(frame);
  }

  valueOfFrame(subSequence, tag, frameIndex = -1, defaultValue = null) {
    return this.valueOf(tag, defaultValue)
      || this.valueOf(`SharedFunctionalGroupsSequence[0].${subSequence}.${tag}`, defaultValue)
      || this.valueOf(`PerFrameFunctionalGroupsSequence[${frameIndex}].${subSequence}.${tag}`, defaultValue);
  }

  valueOf(tag, defaultValue = null) {
    return util.result(this._metadata, tag, defaultValue);
  }

  pixelType(frameIndex = 0) {
    // 0 integer, 1 float
    // dicom only support integers
    return 0;
  }

  studyInstanceUID() {
    return this.valueOf('StudyInstanceUID');
  }

  studyID() {
    return this.valueOf('StudyID');
  }

  studyDate() {
    return this.valueOf('StudyDate');
  }

  studyTime() {
    return this.valueOf('StudyTime');
  }

  accessionNumber() {
    return this.valueOf('AccessionNumber');
  }

  institutionName() {
    return this.valueOf('InstitutionName');
  }

  institutionAddress() {
    return this.valueOf('InstitutionAddress');
  }

  referringPhysicianName() {
    return this.valueOf('ReferringPhysicianName');
  }

  studyDescription() {
    return this.valueOf('StudyDescription');
  }

  seriesInstanceUID() {
    return this.valueOf('SeriesInstanceUID');
  }

  rows() {
    return this.valueOf('Rows');
  }

  columns() {
    return this.valueOf('Columns');
  }

  seriesNumber() {
    return this.valueOf('SeriesNumber');
  }

  seriesDate() {
    return this.valueOf('SeriesDate');
  }

  seriesTime() {
    return this.valueOf('SeriesTime');
  }

  seriesDescription() {
    return this.valueOf('SeriesDescription');
  }

  modality() {
    return this.valueOf('Modality');
  }

  acquisitionNumber() {
    return this.valueOf('AcquisitionNumber');
  }

  bodyPartExamined() {
    return this.valueOf('BodyPartExamined');
  }

  patientId() {
    return this.valueOf('PatientId');
  }

  patientName() {
    return this.valueOf('PatientName');
  }

  patientBirthDate() {
    return this.valueOf('PatientBirthDate');
  }

  patientBirthTime() {
    return this.valueOf('PatientBirthTime');
  }

  patientSex() {
    return this.valueOf('PatientSex');
  }

  patientComments() {
    return this.valueOf('PatientComments');
  }

  frameTime() {
    return parseFloat(this.valueOf('FrameTime'));
  }

  numberOfFrames() {
    return this.valueOf('NumberOfFrames') || 1;
  }

  pixelRepresentation() {
    return this.valueOf('PixelRepresentation');
  }

  highBit() {
    return this.valueOf('HighBit');
  }

  bitsAllocated() {
    return this.valueOf('BitsAllocated');
  }

  rescaleIntercept(frameIndex = 0) {
    return this.valueOfFrame('PixelValueTransformationSequence', 'RescaleIntercept', frameIndex);
  }

  rescaleSlope(frameIndex = 0) {
    return this.valueOfFrame('PixelValueTransformationSequence', 'RescaleSlope', frameIndex);
  }

  windowCenter(frameIndex = 0) {
    return this.valueOfFrame('FrameVOILUTSequence', 'WindowCenter', frameIndex);
  }

  windowWidth(frameIndex = 0) {
    return this.valueOfFrame('FrameVOILUTSequence', 'WindowWidth', frameIndex);
  }

  sliceThickness(frameIndex = 0) {
    return this.valueOfFrame('PixelMeasuresSequence', 'SliceThickness', frameIndex);
  }

  samplesPerPixel() {
    return this.valueOf('SamplesPerPixel');
  }

  numberOfFrames() {
    return this.valueOf('NumberOfFrames', 1);
  }

  numberOfChannels() {
    let numberOfChannels = 1;
    let photometricInterpretation = this.photometricInterpretation();

    if (!(photometricInterpretation !== 'RGB' &&
        photometricInterpretation !== 'PALETTE COLOR' &&
        photometricInterpretation !== 'YBR_FULL' &&
        photometricInterpretation !== 'YBR_FULL_422' &&
        photometricInterpretation !== 'YBR_PARTIAL_422' &&
        photometricInterpretation !== 'YBR_PARTIAL_420' &&
        photometricInterpretation !== 'YBR_RCT')) {
      numberOfChannels = 3;
    }

    return numberOfChannels;
  }

  imageOrientation(frameIndex = 0) {
    let imageOrientation = this.valueOfFrame('PlaneOrientationSequence', 'ImageOrientation', frameIndex);
    if (imageOrientation) {
      imageOrientation = orientation.split('\\').map(Number);
    }
    return imageOrientation;
  }

  pixelAspectRatio() {
    let pixelAspectRatio = this.valueOf('PixelAspectRatio');
    if (pixelAspectRatio) {
      pixelAspectRatio = pixelAspectRatio.split('\\').map(Number);
    }
    return pixelAspectRatio;
  }

  imagePosition(frameIndex = 0) {
    // ImagePosition or ImagePositionPatient ?
    let imagePosition = this.valueOfFrame('PlanePositionSequence', 'ImagePosition', frameIndex);
    if (imagePosition) {
      imagePosition = imagePosition.split('\\').map(Number);
    }
    return imagePosition;
  }

  instanceNumber(frameIndex = 0) {
    let instanceNumber = this.valueOf(`PerFrameFunctionalGroupsSequence[${frameIndex}].x52009230.InstanceNumber`);
    if (instanceNumber === null) {
      instanceNumber = this.valueOf('InstanceNumber');
    }
    return instanceNumber;
  }

  pixelSpacing(frameIndex = 0) {
    let pixelSpacing = this.valueOfFrame('PixelMeasuresSequence', 'PixelSpacing', frameIndex);
    if (pixelSpacing) {
      pixelSpacing = pixelSpacing.split('\\').map(Number);
    }
    return pixelSpacing;
  }

  photometricInterpretation() {
    return this.valueOf('PhotometricInterpretation');
  }

  planarConfiguration() {
    return this.valueOf('PlanarConfiguration');
  }

  sopInstanceUID() {
    return this.valueOf('SOPInstanceUID');
  }
}

export default DicomParser;
