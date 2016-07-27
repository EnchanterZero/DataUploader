var q = require('q');
var fs = require("fs");
var co = require('co');
var path = require('path');
var config = require('../config');
var mongoDBService = require('./dcmMongoService');
import * as util from '../util/index';
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var logger = config.logger;
var dcmTempDir = config.dcmTempDir;
var dcm4cheBinPath = config.dcm4cheBinPath;
var pullingEnd = config.pullingSCP_Host + ':' + config.pullingSCP_Port;
var pushingEnd = config.pushingSCP_Host + ':' + config.pushingSCP_Port;
var pullingSCP_AET = config.pullingSCP_AET;
var pushingSCP_AET = config.pushingSCP_AET;

var dcmAttrCode = config.dcmAttrCode;
//console.log(path.resolve(dcm4cheBinPath));
var execCmd = function (cmd) {
  //logger.info('** run command: **\n'+cmd);
  var defer = q.defer();
  exec(cmd, {
      maxBuffer: 10000 * 1024, // 默认 200 * 1024
    },
    function (err, stdout, stderr) {
      // if(err) {
      //     defer.reject(err);
      // }
      // else defer.resolve({
      //     stdout:stdout,
      //     stderr:stderr,
      //     err:err
      // });
      if (err) {
        logger.error('** exec err: **\n' + cmd + '\n' + err);
      }
      if (stderr) {
        logger.error('** exec stderr: **\n' + cmd + '\n' + stderr);
      }
      defer.resolve({
        stdout: stdout,
        stderr: stderr,
        err: err
      });
    });
  return defer.promise;
}
exports.execCmd = execCmd;
//var
var parseDcmdumpStdout = function (stdout) {
  //logger.info('parsing Dcmdump Stdout...');

  var getUID = function (stdout, CODE) {
    var UID = null;
    if(stdout.match('' + CODE + '.*\\]')) {
      var matchedline = stdout.match('' + CODE + '.*\\]')[0];
      UID = matchedline.split('[')[1].replace(']', '');
    }
    return UID;
  }

  var StudyInstanceUID = getUID(stdout, dcmAttrCode.StudyInstanceUID);
  var SeriesInstanceUID = getUID(stdout, dcmAttrCode.SeriesInstanceUID);
  var SOPInstanceUID = getUID(stdout, dcmAttrCode.SOPInstanceUID);

  /*logger.info('\ngot StudyInstanceUID:  ' + StudyInstanceUID
   + '\ngot SeriesInstanceUID:   ' + SeriesInstanceUID
   + '\ngot SOPInstanceUID   '+ SOPInstanceUID);*/
  if(StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID)
  {
    return {
      StudyInstanceUID: StudyInstanceUID,
      SeriesInstanceUID: SeriesInstanceUID,
      SOPInstanceUID: SOPInstanceUID
    }
  }
}
var parseFindSCUStdout = function (stdout) {

  //logger.info('parsing FindSCU Stdout...');
  var getUID = function (stdout, CODE) {
    var UID = [];
    var regExp = eval("/" + CODE + ".*\\]/g");
    var matchedlines = stdout.match(regExp);

    //console.log('-----matched ' + regExp + ' :  ');
    //console.log(matchedlines);
    if (matchedlines) {
      matchedlines.shift();
      for (var i in matchedlines) {
        UID[i] = matchedlines[i].split('[')[1].replace(']', '');

      }
    }
    //console.log('-----trimed ' + regExp + ' :  ');
    //console.log(UID);
    //console.log('\n');
    return UID;
  }
  var StudyInstanceUID = getUID(stdout, dcmAttrCode.StudyInstanceUID);
  var SeriesInstanceUID = getUID(stdout, dcmAttrCode.SeriesInstanceUID);
  var SOPInstanceUID = getUID(stdout, dcmAttrCode.SOPInstanceUID);

  /*logger.info('\ngot StudyInstanceUID:  ' + StudyInstanceUID
   + '\ngot SeriesInstanceUID:   ' + SeriesInstanceUID
   + '\ngot SOPInstanceUID   '+ SOPInstanceUID);*/

  var results = [];
  for (var i in StudyInstanceUID) {
    var result = {};
    result.StudyInstanceUID = StudyInstanceUID[i];
    if (SeriesInstanceUID.length > 0) {
      result.SeriesInstanceUID = SeriesInstanceUID[i];
    }
    if (SOPInstanceUID.length > 0) {
      result.SOPInstanceUID = SOPInstanceUID[i];
    }
    results.push(result);
  }
  return results;
}
var parseGetSCUStdout = function (stdout) {

}

var parseStoreSCUStdout = function (stdout) {

  //logger.info('parsing StoreSCU Stdout:');

  //fs.writeFileSync(config.projectRoot+'/StoreSCUStdout.log', stdout,{flag:'a'});
  var AffectedSOPInstanceUIDs = [];
  var s = eval('/STORESCU->' + pushingSCP_AET + '\\(\\d\\) >> \\d*:C-STORE-RSP/');
  var blocks = stdout.split(s);
  var count = 0;
  for (var i = 1; i < blocks.length; i++) {
    if (blocks[i].search(/status=0H/) > -1) {

      var matchedlines = blocks[i].match(/iuid=.*-/);
      if (matchedlines) {
        //logger.info('-----matched '+(++count)+':  \n'+blocks[i]);
        var UID = matchedlines[0].replace('iuid=', '').replace(' -', '');
        AffectedSOPInstanceUIDs.push(UID);
      }
    }

  }
  return AffectedSOPInstanceUIDs;
}
exports.parseStoreSCUStdout = parseStoreSCUStdout;
var parseStoreSCUStdoutChunk = function (stdoutChunk) {

  var AffectedSOPInstanceUID = '';
  var storeRsp_ergExp = eval('/STORESCU->' + pushingSCP_AET + '\\(\\d\\) >> \\d*:C-STORE-RSP/');
  if (stdoutChunk.search(storeRsp_ergExp) > -1 && stdoutChunk.search(/status=0H/) > -1) {
    var matchedlines = stdoutChunk.match(/iuid=.*-/);
    if (matchedlines) {
      //logger.info('-----matched '+(++count)+':  \n'+blocks[i]);
      AffectedSOPInstanceUID = matchedlines[0].replace('iuid=', '').replace(' -', '');
    }
  }
  return AffectedSOPInstanceUID;


}
var readOneDcm = function (dcmPath) {
  var c = dcm4cheBinPath + '/dcmdump -w 150 ' + '"' + dcmPath + '"';
  return execCmd(c).then((result)=> {
    var dcmMeta = parseDcmdumpStdout(result.stdout);
    if(dcmMeta){
      dcmMeta._id = dcmMeta.SOPInstanceUID;
      dcmMeta.dcmPath = dcmPath;
      dcmMeta.isSynchronized = false;
    }
    return dcmMeta;
  });
}
var ls = function*(dcmPath) {
  var c = 'ls ' + '"' + dcmPath + '"';
  var result = yield execCmd(c);
  //console.log(result.stdout);
  var files = result.stdout.split('\n');
  if (files[files.length - 1] == '') {
    files.pop();
  }
  return files;
}
/**
 *
 * @returns tempFilesList{Array}
 */
exports.listTempDcms = function*(path) {
  if (path) {
    //console.log('path: '+path);
    return yield ls(dcmTempDir + '/' + path);
  } else {
    //console.log('no path: ');
    return yield ls(dcmTempDir);
  }

}
/**
 *
 * @param dcmPath   Can be a dcm file or a directory
 * @returns dcmMetas {Array}
 */
exports.readDcm = function*(dcmPath) {
  //logger.info('reading local dcms:');

  var dcmMetas = [];
  var stat = fs.lstatSync(dcmPath);
  if (!stat.isDirectory()) {
    /*if(path.extname(dcmPath)=='.dcm'){*/
    var dcmMeta = yield readOneDcm(dcmPath);
    dcmMetas.push(dcmMeta);
    /*}*/
  } else {
    var files = yield ls(dcmPath);
    console.time('many files read--' + dcmPath);
    for (var i = 0; i < files.length; i++) {
      /*if(path.extname(dcmPath)!='.dcm'){
       continue;
       }*/

      //logger.info('---reading [' + (i + 1) + ']: ' + files[i]);
      var dcmMeta = yield readOneDcm(path.join(dcmPath, files[i]));
      dcmMetas.push(dcmMeta);
      //if (i >= 9) break;
    }
    console.timeEnd('many files read--' + dcmPath);
  }
  return dcmMetas;
}

exports.readDcmRecursion = function (Path) {
  var files = [];
  var dcmMetas = [];
  var handleFile = function (path, floor) {
    var blankStr = '';
    for (var i = 0; i < floor; i++) {
      blankStr += '    ';
    }
    var stats = fs.statSync(path)
    if (stats.isDirectory()) {
      console.log('+' + blankStr + path);
    } else {
      console.log('-' + blankStr + path);

      files.push(readOneDcm(path).then((result) =>{
        if(result){
          //console.log(result);
          dcmMetas.push(result);
        }
        return result;
      }).catch((err)=> {
        logger.error(err);
      }));
    }
  }
  util.walk(Path, 0, handleFile);
  return q.all(files).then(()=> {
    return dcmMetas;
  });
}

/**
 * @returns studies {Array}
 */
var findStudies = function*(sourceORdest) {
  /*  findscu -c DCM4CHEE@10.255.177.255:11112 -r StudyInstanceUID  */
  sourceORdest = sourceORdest.toLowerCase();
  var c;
  if (sourceORdest == 'source') {
    c = dcm4cheBinPath + '/findscu'
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -r StudyInstanceUID';
  } else {
    c = dcm4cheBinPath + '/findscu'
      + ' -c ' + pushingSCP_AET + '@' + pushingEnd
      + ' -r StudyInstanceUID';
  }
  var result = yield execCmd(c);
  var studies = parseFindSCUStdout(result.stdout);
  //console.log('!!! found studies: ');
  //console.log(studies);
  return studies;
}
exports.findStudies = findStudies;
/**
 *
 * @param StudyInstanceUID
 *
 * @returns series {Array}
 */
var findSeries = function*(sourceORdest, StudyInstanceUID) {
  sourceORdest = sourceORdest.toLowerCase();
  /*  findscu -c DCM4CHEE@10.255.177.255:11112 -L SERIES -m StudyInstanceUID=1.2.840.88888888.3.20150912121121.7436369 -r StudyInstanceUID -r SeriesInstanceUID  */
  var c;
  if (sourceORdest == 'source') {
    c = dcm4cheBinPath + '/findscu'
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L SERIES'
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -r StudyInstanceUID'
      + ' -r SeriesInstanceUID';
  } else {
    c = dcm4cheBinPath + '/findscu'
      + ' -c ' + pushingSCP_AET + '@' + pushingEnd
      + ' -L SERIES'
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -r StudyInstanceUID'
      + ' -r SeriesInstanceUID';
  }
  var result = yield execCmd(c);
  //console.log(result.stdout);
  var series = parseFindSCUStdout(result.stdout);
  //console.log('!!! found series: ');
  //console.log(series);
  return series;

}
exports.findSeries = findSeries;
/**
 *
 * @param StudyInstanceUID
 * @param SeriesInstanceUID
 *
 * @returns dcms {Array}
 */
var findDcms = function*(sourceORdest, StudyInstanceUID, SeriesInstanceUID) {
  /*findscu -c DCM4CHEE@10.255.177.255:11112 -L IMAGE -m StudyInstanceUID=1.2.410.200010.86.101.5201511200293 -m SeriesInstanceUID=1.3.12.2.1107.5.1.4.65381.30000015112208533703900112915 -r StudyInstanceUID -r SeriesInstanceUID -r SOPInstanceUID*/
  sourceORdest = sourceORdest.toLowerCase();
  var c;
  if (sourceORdest == 'source') {
    c = dcm4cheBinPath + '/findscu'
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L IMAGE'
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -m SeriesInstanceUID=' + SeriesInstanceUID
      + ' -r StudyInstanceUID'
      + ' -r SeriesInstanceUID'
      + ' -r SOPInstanceUID';
  } else {
    c = dcm4cheBinPath + '/findscu'
      + ' -c ' + pushingSCP_AET + '@' + pushingEnd
      + ' -L IMAGE'
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -m SeriesInstanceUID=' + SeriesInstanceUID
      + ' -r StudyInstanceUID'
      + ' -r SeriesInstanceUID'
      + ' -r SOPInstanceUID';
  }

  var result = yield execCmd(c);
  //console.log(result.stdout);
  var dcms = parseFindSCUStdout(result.stdout);
  //console.log('!!! found dcms: ');
  //console.log(dcms);
  return dcms;
}
exports.findDcms = findDcms;


/**
 *
 * @returns allDcms {Array}
 */
exports.findAllSourceDcms = function*(synchronizingStudies) {
  var allDcms = [];
  if (!synchronizingStudies) {
    var studies = yield findStudies('source');
    for (var i in studies) {
      var series = yield findSeries('source', studies[i].StudyInstanceUID);
      for (var j in series) {
        var dcms = yield findDcms('source', series[j].StudyInstanceUID, series[j].SeriesInstanceUID);
        allDcms = allDcms.concat(dcms);
      }
    }
  } else {
    var studies = yield findStudies('source');
    for (var i in studies) {
      if (synchronizingStudies.indexOf(studies[i].StudyInstanceUID) > -1) {
        continue;
      }
      var series = yield findSeries('source', studies[i].StudyInstanceUID);
      for (var j in series) {
        var dcms = yield findDcms('source', series[j].StudyInstanceUID, series[j].SeriesInstanceUID);
        allDcms = allDcms.concat(dcms);
      }
    }
  }
  return allDcms;
}
exports.findAllDestDcms = function*() {
  var allDcms = [];
  var studies = yield findStudies('dest');
  for (var i in studies) {
    var series = yield findSeries('dest', studies[i].StudyInstanceUID);
    for (var j in series) {
      var dcms = yield findDcms('dest', series[j].StudyInstanceUID, series[j].SeriesInstanceUID);
      allDcms = allDcms.concat(dcms);
    }
  }
  return allDcms;
}

/**
 *
 * @returns tempFilesList{Array}
 */
exports.pullAllDcms = function*() {

  //logger.info('pulling all dcms:');
  var studies = yield findStudies();
  for (var i in studies) {
    yield pullDcms(i + 1, 'STUDY', studies[i].StudyInstanceUID, null, null);
  }
  var files = yield ls(dcmTempDir);
  return files;
}


/**
 *
 * @param count  {Number}
 * @param retrieveLevel
 * @param StudyInstanceUID
 * @param SeriesInstanceUID
 * @param SOPInstanceUID
 */
var pullDcms = function*(count, retrieveLevel, StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) {
  var l = retrieveLevel.toUpperCase();
  var c;
  if (l == 'STUDY') {
    logger.info('pulling dcm:[' + count + '] ' + l + ' [StudyInstanceUID]' + StudyInstanceUID);
    c = dcm4cheBinPath + '/getscu'
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L ' + l
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' --directory ' + dcmTempDir;
  }
  if (l == 'SERIES') {
    logger.info('pulling dcm:[' + count + '] ' + l
      + ' [StudyInstanceUID]' + StudyInstanceUID
      + ' [SeriesInstanceUID]' + SeriesInstanceUID);
    c = dcm4cheBinPath + '/getscu '
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L ' + l
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -m SeriesInstanceUID=' + SeriesInstanceUID
      + ' --directory ' + dcmTempDir;
  }
  if (l == 'IMAGE') {
    logger.info('pulling dcm:[' + count + '] ' + l
      + ' [StudyInstanceUID]' + StudyInstanceUID
      + ' [SeriesInstanceUID]' + SeriesInstanceUID
      + ' [SOPInstanceUID]' + SOPInstanceUID);

    c = dcm4cheBinPath + '/getscu '
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L ' + l
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -m SeriesInstanceUID=' + SeriesInstanceUID
      + ' -m SOPInstanceUID=' + SOPInstanceUID
      + ' --directory ' + dcmTempDir;
  }
  var result = yield execCmd(c);
  //console.log(result.stdout);
}
exports.pullDcms = pullDcms;

var pullDcmsToDir = function*(count, retrieveLevel, StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, dir) {
  var l = retrieveLevel.toUpperCase();
  var c;
  if (l == 'STUDY') {
    logger.info('pulling dcm:[' + count + '] ' + l + ' [StudyInstanceUID]' + StudyInstanceUID);
    c = dcm4cheBinPath + '/getscu'
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L ' + l
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' --directory ' + dcmTempDir + '/' + dir;
  }
  if (l == 'SERIES') {
    logger.info('pulling dcm:[' + count + '] ' + l
      + ' [StudyInstanceUID]' + StudyInstanceUID
      + ' [SeriesInstanceUID]' + SeriesInstanceUID);
    c = dcm4cheBinPath + '/getscu '
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L ' + l
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -m SeriesInstanceUID=' + SeriesInstanceUID
      + ' --directory ' + dcmTempDir + '/' + dir;
  }
  if (l == 'IMAGE') {
    logger.info('pulling dcm:[' + count + '] ' + l
      + ' [StudyInstanceUID]' + StudyInstanceUID
      + ' [SeriesInstanceUID]' + SeriesInstanceUID
      + ' [SOPInstanceUID]' + SOPInstanceUID);

    c = dcm4cheBinPath + '/getscu '
      + ' -c ' + pullingSCP_AET + '@' + pullingEnd
      + ' -L ' + l
      + ' -m StudyInstanceUID=' + StudyInstanceUID
      + ' -m SeriesInstanceUID=' + SeriesInstanceUID
      + ' -m SOPInstanceUID=' + SOPInstanceUID
      + ' --directory ' + dcmTempDir + '/' + dir;
  }
  var result = yield execCmd(c);
}
exports.pullDcmsToDir = pullDcmsToDir;


/**
 *
 * @param path
 *
 * @return AffectedSOPClassUIDs {Array}
 */
exports.pushDcms = function*(path) {
  //logger.info('pushing all dcms:');
  /*storescu -c DCM4CHEE@10.255.177.255:11112 ~intern07/Desktop/dicdom/000005.dcm*/
  var c = dcm4cheBinPath + '/storescu'
    + ' -c ' + pushingSCP_AET + '@' + pushingEnd
    + ' "' + path + '"';
  var result = yield execCmd(c);
  //console.log(result.stdout);
  var AffectedSOPClassUIDs = parseStoreSCUStdout(result.stdout);
  //var AffectedSOPClassUIDs = parseStoreSCUStdout(testStdout);
  return AffectedSOPClassUIDs;
}
exports.pushDcmsAndRecordOneByOne = function (synchronizeID, stepcount, path) {
  //logger.info('pushing all dcms:');
  var defer = q.defer();
  var countpush = 0;
  var countrecord = 0;
  var isExited = false;
  var AffectedSOPClassUIDs = [];
  var command = dcm4cheBinPath + '/storescu';
  var args = ['-c', pushingSCP_AET + '@' + pushingEnd, path];

  var storescu = spawn(command, args);

  storescu.stdout.on('data', (data) => {
    // console.log('//////////');
    // console.log(data.toString());
    // console.log('//////////');

    var pushedStudyIDs = parseStoreSCUStdout(data.toString());
    if (pushedStudyIDs.length > 0) {

      co(function*() {
        yield mongoDBService.setDcmSynchronized(pushedStudyIDs);
        for (var i in pushedStudyIDs) {
          countrecord++;
          logger.info('[synchronize ' + synchronizeID + '][step ' + (stepcount) + ' push] updated push Dcm :(' + (countrecord) + ')[' + pushedStudyIDs[i] + ']');

        }
        AffectedSOPClassUIDs = AffectedSOPClassUIDs.concat(pushedStudyIDs);
        if (isExited) {
          storescu.emit('updated push Dcm', countrecord);
        }
      }).catch(function (err) {
        console.log(err + ' : ' + err.stack);
      });
      for (var i in pushedStudyIDs) {
        countpush++;
        logger.info('[synchronize ' + synchronizeID + '][step ' + (stepcount) + ' push] pushed Dcm :(' + (countpush) + ')[' + pushedStudyIDs[i] + ']');

      }
    }
  });
  storescu.stderr.on('err', (data) => {
    logger.error('stderr:' + data);
  });
  storescu.on('exit', () => {
    //console.log('-----------------------------[On exit]');
    isExited = true;
    if (countrecord == countpush && isExited) {
      console.log('-----------------------------[On resolve] ' + countpush);
      defer.resolve(AffectedSOPClassUIDs);
    }

  });
  storescu.on('updated push Dcm', (countrecord)=> {
    //console.log('-----------------------------[get message] '+countpush);
    if (countrecord == countpush && isExited) {
      console.log('-----------------------------[On resolve] ' + countpush);
      defer.resolve(AffectedSOPClassUIDs);
    }
  });

  return defer.promise;
}


/**
 *
 * @param dcmPaths
 */
var rmLocalSynchronizedDcms = function*(dcmPaths) {
  //logger.info('removing Local Synchronized Dcms:');

  for (var i in dcmPaths) {
    var c = 'rm ' + '"' + dcmPaths[i] + '"';
    var result = yield execCmd(c);
  }
}
exports.rmLocalSynchronizedDcms = rmLocalSynchronizedDcms;

var rmAllLocalDcms = function*(dcmDirPath) {

  var c = 'rm -rf ' + '"' + dcmDirPath + '/"*';
  var result = yield execCmd(c);
  //console.log(result);
}
exports.rmAllLocalDcms = rmAllLocalDcms;

var rmStudyDir = function*(DirPath) {

  var c = 'rm -rf ' + '"' + DirPath + '"';
  var result = yield execCmd(c);
  //console.log(result);
}
exports.rmStudyDir = rmStudyDir;

var cpStudyDir = function*(DirPath, dest) {

  var c = 'cp -r ' + '"' + DirPath + '"' + ' ' + '"' + dest + '"';
  var result = yield execCmd(c);
  //console.log(result);
}
exports.cpStudyDir = cpStudyDir;

var formatDcmForDB = function (dcms) {
  //console.log('Array.isArray(dcms) : ' + Array.isArray(dcms));
  if (Array.isArray(dcms)) {
    for (var i in dcms) {
      var dcm = dcms[i];
      dcm._id = dcms[i].SOPInstanceUID;
      dcm.dcmPath = '';
      dcm.isSynchronized = false;
    }
  } else {
    dcms._id = dcms.SOPInstanceUID;
    dcms.dcmPath = '';
    dcms.isSynchronized = false;
  }

  return dcms;
}
exports.formatDcmForDB = formatDcmForDB;

var formatInitDcmForDB = function (dcms) {
  //console.log('Array.isArray(dcms) : ' + Array.isArray(dcms));
  if (Array.isArray(dcms)) {
    for (var i in dcms) {
      var dcm = dcms[i];
      dcm._id = dcms[i].SOPInstanceUID;
      dcm.dcmPath = '';
      dcm.isSynchronized = true;
    }
  } else {
    dcms._id = dcms.SOPInstanceUID;
    dcms.dcmPath = '';
    dcms.isSynchronized = true;
  }

  return dcms;
}
exports.formatInitDcmForDB = formatInitDcmForDB;