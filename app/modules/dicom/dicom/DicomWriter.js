
import { DataStream } from '../../../modules/file';
const parser = require('./parser');

import { util } from '../../../util';
const logger = util.logger.getLogger('dicom');

const anonymizeRules = {
  x00100010: {
    action: 'replace',
    value: 'Anonymous ',
  },
};

class DicomWriter {

  constructor(image, options) {
    this.image = image;
    this.dataSet = image.metadata()._dataSet;
    this.options = options || {};
    this.anonymize = true;
  }

  getKeys() {
    let keys = Object.keys(this.image.metadata()._dataSet.elements);
    keys.sort();

    const headerStart = keys.indexOf('x00020000');
    let headerEnd = -1;
    for (let i = 0; i < keys.length; ++i) {
      if (keys[i] >= 'x00030000') {
        headerEnd = i;
        break;
      }
    }
    if (headerStart === -1) {
      logger.warn('dicom does not contains a header.');
    } else if (headerStart !== 0) {
      let orderedKeys = keys.slice(headerStart, headerEnd);
      orderedKeys = orderedKeys.concat(keys.slice(0, headerStart));
      orderedKeys = orderedKeys.concat(keys.slice(headerEnd));
      keys = orderedKeys;
    }
    return keys;
  }

  save() {
    const dataSet = this.image.metadata()._dataSet;
    let keys = Object.keys(dataSet.elements);
    keys.sort();

    const headerStart = keys.indexOf('x00020000');
    let headerEnd = -1;
    for (let i = 0; i < keys.length; ++i) {
      if (keys[i] >= 'x00030000') {
        headerEnd = i;
        break;
      }
    }
    if (headerStart == -1) {
      logger.debug('error');
    } else if (headerStart != 0) {
      let orderedKeys = keys.slice(headerStart, headerEnd);
      orderedKeys = orderedKeys.concat(keys.slice(0, headerStart));
      orderedKeys = orderedKeys.concat(keys.slice(headerEnd));
      keys = orderedKeys;
    }

    let totalLength = 128 + 4;
    for ( let j = 0 ; j < keys.length; ++j ) {
        const key = keys[j];
        const element = dataSet.elements[key];
        if ( element && element.tag ) {
          if (this.anonymize && anonymizeRules[element.tag]) {
            const rule = anonymizeRules[element.tag];
            if (rule.action === 'replace') {
              totalLength += DicomWriter.getElementTagSize(element);
              totalLength += DicomWriter.getElementLengthSize(element, rule.value.length);
            } else if (rule.action === 'remove') {
              continue;
            }
          } else if (key == 'x00020010') {
            let syntax = DicomWriter.readTransferSyntax(dataSet);
            if (syntax === '1.2.840.10008.1.2.2' || syntax === '1.2.840.10008.1.2.1.99') {
              syntax = '1.2.840.10008.1.2.1'
            }
            const length = syntax.length + (syntax.length % 2);
            totalLength += DicomWriter.getElementTagSize(element);
            totalLength += DicomWriter.getElementLengthSize(element, length);
          } else {
            totalLength += DicomWriter.getElementTagSize(element);
            totalLength += DicomWriter.getElementLengthSize(element);
          }
        }
    }


    const arrayBuffer = new ArrayBuffer(totalLength);
    const stream = new DataStream(arrayBuffer, 0, true);
    stream.seek(128);
    stream.writeString("DICM", "ASCII", null);
    for ( let j = 0 ; j < keys.length; ++j ) {
      const key = keys[j];
      const element = dataSet.elements[key];
      if ( element && element.tag ) {
        if (this.anonymize && anonymizeRules[element.tag]) {
          const rule = anonymizeRules[element.tag];
          if (rule.action === 'replace') {
              DicomWriter.writeElementTag(stream, element)
              DicomWriter.writeElementLength(stream, element, rule.value.length);
              stream.writeString(rule.value, 'ASCII', null);
          } else if (rule.action === 'remove') {
              continue;
          }
        } else if (key == 'x00020010') {
            DicomWriter.writeElementTag(stream, element);
            let syntax = DicomWriter.readTransferSyntax(dataSet);
            if (syntax === '1.2.840.10008.1.2.2' || syntax === '1.2.840.10008.1.2.1.99') {
                syntax = '1.2.840.10008.1.2.1'
            }
            const length = syntax.length + (syntax.length % 2);
            DicomWriter.writeElementLength(stream, element, length);
            stream.writeString(syntax, 'ASCII', length);
        } else {
            DicomWriter.writeElementTag(stream, element);
            DicomWriter.writeElementLength(stream, element);
            const vl = DicomWriter.getElementValueAsUint8Array(dataSet, element);
            stream.writeUint8Array(vl);
        }
      }
    }
    return arrayBuffer;
  }

  static isValidVR(vr) {
    const validVR = {
      OB: true,
      AW: true,
      AE: true,
      AS: true,
      CS: true,
      UI: true,
      DA: true,
      DS: true,
      DT: true,
      IS: true,
      LO: true,
      LT: true,
      OW: true,
      PN: true,
      ST: true,
      TM: true,
      UN: true,
      UT: true,
      SQ: true,
      SH: true,
      FL: true,
      SL: true,
      AT: true,
      UL: true,
      US: true,
      SS: true,
      FD: true,
    };
    return !!validVR[vr];
  }

  static getDataLengthSizeInBytesForVR(vr) {
    if (!DicomWriter.isValidVR(vr) ||
      vr === 'OB' ||
      vr === 'OW' ||
      vr === 'SQ' ||
      vr === 'OF' ||
      vr === 'UT' ||
      vr === 'UN') {
      return 4;
    }
    return 2;
  }

  static getElementValueAsUint8Array(dataSet, element) {
    return dataSet.byteArray.subarray(element.dataOffset, element.dataOffset + element.length);
  }

  static readTransferSyntax(dataSet) {
    if (dataSet.elements.x00020010 === undefined) {
      throw new Error('dicomParser.parseDicom: missing required meta header attribute 0002,0010');
    }
    const transferSyntaxElement = dataSet.elements.x00020010;
    return parser.readFixedString(dataSet.byteArray, transferSyntaxElement.dataOffset,
      transferSyntaxElement.length);
  }

  static writeElementTag(stream, element) {
    const group = parseInt(element.tag.substr(1, 4), 16);
    const elem = parseInt(element.tag.substr(5, 8), 16);
    stream.writeUint16(group, null);
    stream.writeUint16(elem, null);
    if (element.vr) {
      stream.writeString(element.vr, 'ASCII', null);
    }
  }

  static getElementTagSize(element) {
    return 4 + (element.vr ? 2 : 0);
  }

  static getElementLengthSize(element, len) {
    const lengthSize = DicomWriter.getDataLengthSizeInBytesForVR(element.vr);
    let length = len;
    if (length === undefined) {
      length = element.length;
    }
    if (lengthSize === 4) {
      if (DicomWriter.isValidVR(element.vr)) {
        return 6 + length;
      }
      return 4 + length;
    }
    return 2 + length;
  }

  static writeElementLength(stream, element, len) {
    const lengthSize = DicomWriter.getDataLengthSizeInBytesForVR(element.vr);
    let length = len;
    if (length === undefined) {
      length = element.hadUndefinedLength ? -1 : element.length;
    }
    if (lengthSize === 4) {
      if (DicomWriter.isValidVR(element.vr)) {
        stream.seek(stream.position + 2);
      }
      stream.writeUint32(length, null);
    } else {
      stream.writeUint16(length, null);
    }
  }

}

export default DicomWriter;
