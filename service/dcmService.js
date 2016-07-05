var q = require('q');
var fs = require("fs");
var path = require('path');
var config = require('../config');
var exec = require('child_process').exec;

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
            //     console.log('err : ');
            //     console.log(err);
            //     defer.reject(err);
            // }
            // else defer.resolve({
            //     stdout:stdout,
            //     stderr:stderr,
            //     err:err
            // });
            if (err) {
                logger.error('** exec err: **\n'+ cmd +'\n'+err);
            }
            if (stderr){
                logger.error('** exec stderr: **\n'+ cmd +'\n'+stderr);
            }
            defer.resolve({
                stdout: stdout,
                stderr: stderr,
                err: err
            });
        });
    return defer.promise;
}
//var
var parseDcmdumpStdout = function (stdout) {
    logger.info('parsing Dcmdump Stdout...');

    var getUID = function (stdout, CODE) {
        var UID;
        var matchedline = stdout.match('' + CODE + '.*\\]')[0];
        UID = matchedline.split('[')[1].replace(']', '');
        return UID;
    }

    var StudyInstanceUID = getUID(stdout, dcmAttrCode.StudyInstanceUID);
    var SeriesInstanceUID = getUID(stdout, dcmAttrCode.SeriesInstanceUID);
    var SOPInstanceUID = getUID(stdout, dcmAttrCode.SOPInstanceUID);

    /*logger.info('\ngot StudyInstanceUID:  ' + StudyInstanceUID
        + '\ngot SeriesInstanceUID:   ' + SeriesInstanceUID
        + '\ngot SOPInstanceUID   '+ SOPInstanceUID);*/

    return {
        StudyInstanceUID: StudyInstanceUID,
        SeriesInstanceUID: SeriesInstanceUID,
        SOPInstanceUID: SOPInstanceUID
    }
}
var parseFindSCUStdout = function (stdout) {

    logger.info('parsing FindSCU Stdout...');
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

    logger.info('parsing StoreSCU Stdout:');
    
    //fs.writeFileSync(config.projectRoot+'/StoreSCUStdout.log', stdout,{flag:'a'});
    var getUID = function (stdout, CODE) {
        var UIDs = [];
        var s = eval('/STORESCU->' + pushingSCP_AET + '\\(\\d\\) >> \\d*:C-STORE-RSP/');
        var blocks = stdout.split(s);
        var count=0;
        for(var i=1;i < blocks.length;i++){
            
            var regExp = eval("/" + CODE + ".*\\]/");
            if(blocks[i].search(regExp) > -1 && blocks[i].search(/status=0H/) > -1){

                var matchedlines = blocks[i].match(/iuid=.*-/);
                //console.log(matchedlines[0]);
                if(matchedlines){
                    //logger.info('-----matched '+(++count)+':  \n'+blocks[i]);
                    var UID = matchedlines[0].replace('iuid=','').replace(' -','');
                    UIDs.push(UID);
                }
            }
            
        }
        return UIDs;
    }
    var AffectedSOPInstanceUIDs = getUID(stdout, dcmAttrCode.AffectedSOPInstanceUID);

    logger.info('got AffectedSOPInstanceUIDs:  ' + AffectedSOPInstanceUIDs);
    return AffectedSOPInstanceUIDs;

    
}
var readOneDcm = function*(dcmPath) {
    var c = dcm4cheBinPath + '/dcmdump -w 150 ' + '"' + dcmPath + '"';
    var result = yield execCmd(c);
    //console.log('------readOneDcm:  ' + dcmPath);
    //console.log(result.stdout);

    var dcmMeta = parseDcmdumpStdout(result.stdout);
    dcmMeta._id = dcmMeta.SOPInstanceUID;
    dcmMeta.dcmPath = dcmPath;
    dcmMeta.isSynchronized = false;
    return dcmMeta;
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
exports.listTempDcms = function* () {
     return yield ls(dcmTempDir);
}
/**
 *
 * @param dcmPath   Can be a dcm file or a directory
 * @returns dcmMetas {Array}
 */
exports.readDcm = function*(dcmPath) {
    logger.info('reading local dcms:');

    var dcmMetas = [];
    var stat = fs.lstatSync(dcmPath);
    if (!stat.isDirectory()) {
        /*if(path.extname(dcmPath)=='.dcm'){*/
        var dcmMeta = yield readOneDcm(dcmPath);
        dcmMetas.push(dcmMeta);
        /*}*/
    } else {
        var files = yield ls(dcmPath);
        console.time('many files read');
        for (var i in files) {
            /*if(path.extname(dcmPath)!='.dcm'){
             continue;
             }*/

            logger.info('---reading : '+files[i]);
            var dcmMeta = yield readOneDcm(path.join(dcmPath, files[i]));
            dcmMetas.push(dcmMeta);
            //if (i >= 9) break;
        }
        console.timeEnd('many files read');
    }
    return dcmMetas;
}

/**
 * @returns studies {Array}
 */
var findStudies = function*() {
    /*  findscu -c DCM4CHEE@10.255.177.255:11112 -r StudyInstanceUID  */
    var c = dcm4cheBinPath + '/findscu'
        + ' -c ' + pullingSCP_AET + '@' + pullingEnd
        + ' -r StudyInstanceUID';
    var result = yield execCmd(c);
    //console.log(result.stdout);
    console.log(result.stderr);
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
var findSeries = function*(StudyInstanceUID) {
    /*  findscu -c DCM4CHEE@10.255.177.255:11112 -L SERIES -m StudyInstanceUID=1.2.840.88888888.3.20150912121121.7436369 -r StudyInstanceUID -r SeriesInstanceUID  */
    var c = dcm4cheBinPath + '/findscu'
        + ' -c ' + pullingSCP_AET + '@' + pullingEnd
        + ' -L SERIES'
        + ' -m StudyInstanceUID=' + StudyInstanceUID
        + ' -r StudyInstanceUID'
        + ' -r SeriesInstanceUID'
    var result = yield execCmd(c);
    //console.log(result.stdout);
    console.log(result.stderr);
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
var findDcms = function*(StudyInstanceUID, SeriesInstanceUID) {
    /*findscu -c DCM4CHEE@10.255.177.255:11112 -L IMAGE -m StudyInstanceUID=1.2.410.200010.86.101.5201511200293 -m SeriesInstanceUID=1.3.12.2.1107.5.1.4.65381.30000015112208533703900112915 -r StudyInstanceUID -r SeriesInstanceUID -r SOPInstanceUID*/
    var c = dcm4cheBinPath + '/findscu'
        + ' -c ' + pullingSCP_AET + '@' + pullingEnd
        + ' -L IMAGE'
        + ' -m StudyInstanceUID=' + StudyInstanceUID
        + ' -m SeriesInstanceUID=' + SeriesInstanceUID
        + ' -r StudyInstanceUID'
        + ' -r SeriesInstanceUID'
        + ' -r SOPInstanceUID';
    var result = yield execCmd(c);
    //console.log(result.stdout);
    console.log(result.stderr);
    var dcms = parseFindSCUStdout(result.stdout);
    //console.log('!!! found dcms: ');
    //console.log(dcms);
    return dcms;
}
exports.findDcms = findDcms;
exports.findAllDcms = function*() {
    var allDcms = [];
    var studies = yield findStudies();
    for (var i in studies) {
        var series = yield findSeries(studies[i].StudyInstanceUID);
        for (var j in series) {
            var dcms = yield findDcms(series[j].StudyInstanceUID, series[j].SeriesInstanceUID);
            allDcms = allDcms.concat(dcms);
        }
    }
    return allDcms;
}
exports.pullAllDcms = function*() {

    logger.info('pulling all dcms:');
    var studies = yield findStudies();
    for (var i in studies) {
        yield pullDcms('STUDY', studies[i].StudyInstanceUID);
    }
    var files = yield ls(dcmTempDir);
    return files;
}
var pullDcms = function*(retrieveLevel, StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) {
    var l = retrieveLevel.toUpperCase();
    var c;
    if (l == 'STUDY') {
        logger.info('pulling dcm: ' + l +' [StudyInstanceUID]'+StudyInstanceUID );
        c = dcm4cheBinPath + '/getscu'
            + ' -c ' + pullingSCP_AET + '@' + pullingEnd
            + ' -L ' + l
            + ' -m StudyInstanceUID=' + StudyInstanceUID
            + ' --directory ' + dcmTempDir;
    }
    if (l == 'SERIES') {
        logger.info('pulling dcm: ' + l
            +' [StudyInstanceUID]'+StudyInstanceUID
            +' [SeriesInstanceUID]'+SeriesInstanceUID);
        c = dcm4cheBinPath + '/getscu '
            + ' -c ' + pullingSCP_AET + '@' + pullingEnd
            + ' -L ' + l
            + ' -m StudyInstanceUID=' + StudyInstanceUID
            + ' -m SeriesInstanceUID=' + SeriesInstanceUID
            + ' --directory ' + dcmTempDir;
    }
    if (l == 'IMAGE') {
        logger.info('pulling dcm: ' + l
            +' [StudyInstanceUID]'+StudyInstanceUID
            +' [SeriesInstanceUID]'+SeriesInstanceUID
            +' [SOPInstanceUID]'+SOPInstanceUID);

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
    console.log(result.stderr);
}
exports.pullDcms = pullDcms;

/**
 *
 * @param path
 *
 * @return AffectedSOPClassUIDs {Array}
 */
exports.pushDcms = function*(path) {
    logger.info('pushing all dcms:');
    /*storescu -c DCM4CHEE@10.255.177.255:11112 ~intern07/Desktop/dicdom/000005.dcm*/
    var c = dcm4cheBinPath + '/storescu'
        + ' -c ' + pushingSCP_AET + '@' + pushingEnd
        + ' "' + path + '"';
    var result = yield execCmd(c);
    //console.log(result.stdout);
    var AffectedSOPClassUIDs = parseStoreSCUStdout(result.stdout);
    //var testStdout = fs.readFileSync('/Users/intern07/Desktop/dcm4che-3.3.7/bin/log_storescu','utf-8');
    //console.log(testStdout);
    //var AffectedSOPClassUIDs = parseStoreSCUStdout(testStdout);
    return AffectedSOPClassUIDs;


}
exports.rmLocalSynchronizedDcms = function* (dcmPaths) {
    logger.info('removing Local Synchronized Dcms:');

    for(var i in dcmPaths){
        var c = 'rm ' + '"' + dcmPaths[i] + '"';
        var result = yield execCmd(c);
    }
}

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