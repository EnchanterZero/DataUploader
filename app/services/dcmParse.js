import { DicomParser, DicomWriter } from '../modules/dicom';
import { DataStream } from '../modules/file';
import { util } from '../util';
const logger = util.logger.getLogger('upload');
import path from 'path';
import fs from 'fs';
import walk from 'walk';
import Promise from 'bluebird';
import co from 'co';
import OSS from 'ali-oss';


function rm(dirpath) {
  const absolutePath = path.resolve(dirpath);
  if (absolutePath === '' || absolutePath === '/') {
    return Promise.reject(new Error('wrong path'));
  }
  return runProcess('rm', ['-rf', dirpath]);
}

function toArrayBuffer(buffer) {
  var ab = new ArrayBuffer(buffer.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
}

function toBuffer(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

function getDcmInfo(metadata, filePath) {
  return {
    PatientName: metadata.PatientName,
    PatientID: metadata.PatientID,
    StudyInstanceUID: metadata.StudyInstanceUID,
    SeriesInstanceUID: metadata.SeriesInstanceUID,
    SOPInstanceUID: metadata.SOPInstanceUID,
    dcmPath: filePath,
  }
}
function parseAndAnymouse(srcDir, anonymousDir) {
  return new Promise((resolve, reject) => {
    const dcmInfos = [];
    const walker = walk.walk(srcDir);
    walker.on("file", function (root, fileStats, next) {
      const filepath = path.join(root, fileStats.name);
      try {
        const content = fs.readFileSync(filepath);
        const stream = new DataStream(toArrayBuffer(content));
        const parser = new DicomParser(stream);
        parser.parse().then(() => {
          const metadata = parser.metadata();
          delete metadata._dataSet;
          console.log('-----console.log(metadata)-----start');
          dcmInfos.push(getDcmInfo(metadata, filepath));
          console.log('-----console.log(metadata)-----end');
        });
      } catch (e) {
        logger.info(`pasering ${fileStats.name}`, e);
      }
      next();
    });
    walker.on("errors", function (root, nodeStatsArray, next) {
      logger.debug(`error ${root} ${nodeStatsArray}`);
      next();
    });
    walker.on("end", function () {
      resolve(dcmInfos);
    });
  });
}

function parseDicom(srcDir) {
  return co(function*() {
    const dcmInfos = yield parseAndAnymouse(srcDir);
    console.log(dcmInfos);
  });
}

export {
  parseDicom
}
