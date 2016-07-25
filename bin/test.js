var co = require('co');
var config = require('../config');
var dcmService = require('../service/dcmService');
var sychronizeService = require('../service/synchronizeService');
var mongoDBService = require('../service/mongoDBService');

var logger = config.logger;
var dcm4cheBinPath = config.dcm4cheBinPath;
/**
 * test
 */
co(function*(){
    var cmdPre = dcm4cheBinPath + '/storescu -c DCM4CHEE@10.255.177.255:11112 ~intern07/Desktop/dcms/';
    var cmds = [
        ['dicom'     ,'DICOM'],
        ['CXC_Dicom' ,'1.2.840.88888888.3.20150825145012.7421970'],
        ['CYS_Dicom' ,'1.2.410.200010.86.101.5201411140048'],
        ['TXM_Dicom' ,'1.2.410.200010.86.101.5201409020323'],
        ['WLX_Dicom' ,'1.2.840.113704.1.111.3212.1421723265.341'],
        ['WQP_Dicom' ,'1.2.840.88888888.3.20150817100406.7415099'],
        ['WY_Dicom'  ,'1.2.410.200010.86.101.5201604130049'],
        ['XGS_Dicom' ,'1.2.840.88888888.3.20150804152910.7405384'],
        ['YLF_Dicom' ,'1.2.840.88888888.3.20150912121121.7436369'],
        ['ZCH_Dicom' ,'1.2.410.200010.86.101.5201511200293']
    ];
    yield sychronizeService.wait(1000);
    for(var i in cmds){
        logger.info('                                               TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT------ adding :' + cmds[i][1]);
        yield dcmService.execCmd(cmdPre+cmds[i][0]);
        logger.info('                                               TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT------ finish :' + cmds[i][1]);
        var time;
        yield sychronizeService.wait(29231);
    }

}).catch(function (err) {
    logger.error(err + '\n' + err.stack, {time: new Date().getTime()});
});
require('./run');
