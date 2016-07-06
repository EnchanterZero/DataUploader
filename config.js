/**
 * Created by intern07 on 6/21/16.
 */
var winston = require('winston');

/**
 * project config
 */
exports.projectRoot = __dirname;
//the directory of the logHomePath must exists
var logHomePath = __dirname + '/' + 'logs/';

exports.pullDcmsTopullStudyThreshold = 20;
exports.rePushTroubleCountThreshold = 5;
exports.rePushTroubleWait = 5000;
console.log(__dirname);
console.log(logHomePath);

/**
 * dcmService config
 */
exports.dcm4cheBinPath = __dirname +'/'+'dcm4che-3.3.7/bin';
exports.dcmTempDir = __dirname + '/' + 'dcmTempDir';
exports.pullingSCP_AET = 'DCM4CHEE';
exports.pullingSCP_Host = '10.255.177.255';
exports.pullingSCP_Port = '11112';

exports.pushingSCP_AET = 'DCM4CHEE';
exports.pushingSCP_Host = '10.255.177.255';
exports.pushingSCP_Port = '51112';

exports.dcmAttrCode = {
    SOPInstanceUID:'0008,0018',
    StudyInstanceUID:'0020,000D',
    SeriesInstanceUID:'0020,000E',
    //getsuc返回的stdout中用来取得下载到的dcm文件的SOPInstanceUID
    AffectedSOPInstanceUID:'0000,1000',

    ErrorComment:"0000,0902"
}
/**
 * mongodb conn config
 */
exports.mongodbHost = 'localhost';
exports.mongodbPort = '27017';
exports.mongodbBaseName = 'dcm';

/**
 * winston config
 */
var logger = new (winston.Logger)({
    exitOnError: false,
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'info-file',
            filename: logHomePath + 'info.log',
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-file',
            filename: logHomePath + 'error.log',
            level: 'error'
        })
    ],
    exceptionHandlers: [
        new (winston.transports.Console)(),
        new winston.transports.File({ filename: logHomePath + 'exceptions.log' })
    ]
});
exports.logger = logger;