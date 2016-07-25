var co = require('co');
var config = require('../config');
var dcmService = require('../service/dcmService');
var sychronizeService = require('../service/synchronizeService');
var mongoDBService = require('../service/mongoDBService');

var logger = config.logger;
var maxsynchronizeNum = config.maxsynchronizeNum;

/**
 * run
 */
co(function*() {

    logger.info('\n\n//////////////////////////////////////////////////////////////////////' +
        '//////////////////////////////////////////////////////////////////////////////');
    var synchronizingStudies = [];
    var diffID = 1;
    var synchronizeID = 1;
    var flag = true;
    var pedding = false;
    while (flag) {

        if (diffID == 1) {
            yield sychronizeService.init();
        }
        if(!pedding){
            var diff = yield sychronizeService.getDiff(diffID++, synchronizingStudies);
            var newDcmsStudiesIds = diff.newDcmsStudiesIds;

            logger.info('########## before:');
            logger.info('---------- synchronizing Studies [' + synchronizingStudies.length + ']: ' + synchronizingStudies);
            logger.info('########## new DcmsStudiesIds [' + newDcmsStudiesIds.length + ']: ' + newDcmsStudiesIds);
            //synchronizingStudies = _.uniq(synchronizingStudies.concat(newDcmsStudiesIds));

            for (var x in newDcmsStudiesIds) {
                (function x(i) {

                    if (synchronizingStudies.indexOf(newDcmsStudiesIds[i]) == -1 && synchronizingStudies.length < maxsynchronizeNum) {
                        var ID = synchronizeID++;
                        //将该studyID添加入正在同步的study记录
                        synchronizingStudies.push(newDcmsStudiesIds[i]);
                        co(function*() {
                            var newstudtID = newDcmsStudiesIds[i];
                            logger.info('########## ID[' + (ID) + '] record added (synchronize : '+newstudtID+' )');
                            logger.info('---------- ID[' + (ID) + '] synchronizing Studies [' + synchronizingStudies.length + ']: ' + synchronizingStudies);
                            logger.info('########## ID[' + (ID) + '] new DcmsStudiesIds [' + newDcmsStudiesIds.length + ']: ' + newDcmsStudiesIds);
                            yield mongoDBService.addSynchronizingStudy({
                                '_id': newstudtID,
                                'StudyInstanceUID': newstudtID
                            });
                            //执行同步操作
                            var SynchronizedStudyID = yield sychronizeService.synchronizeOnce(ID, newstudtID);
                            //将该studyID从正在同步的study记录中删除
                            //console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   i:' + i);
                            var index = synchronizingStudies.indexOf(SynchronizedStudyID);
                            if (index > -1) {
                                yield mongoDBService.removeSynchronizingStudy(SynchronizedStudyID);
                                synchronizingStudies.splice(index, 1);
                                logger.info('########## ID[' + (ID) + '] record removed (' + index + ') ');
                                logger.info('---------- ID[' + (ID) + '] synchronizing Studies [' + synchronizingStudies.length + ']: ' + synchronizingStudies);
                                logger.info('########## ID[' + (ID) + '] new DcmsStudiesIds [' + newDcmsStudiesIds.length + ']: ' + newDcmsStudiesIds);
                                if(synchronizingStudies.length < maxsynchronizeNum ){
                                    pedding =false;
                                }
                            }else{
                                throw '同步了不应同步的study!'
                            }
                        }).catch(function (err) {
                            logger.error(err + ' : ' + err.stack);
                        });
                    } else {
                    }

                })(x);
            }
            if(synchronizingStudies.length >= maxsynchronizeNum ){
                console.log('synchronizingStudies.length : ' + synchronizingStudies.length);
                console.log('maxsynchronizeNum : ' + maxsynchronizeNum);
                pedding =true;
            }
        }else{
            logger.info('diff waiting..........');
            yield sychronizeService.wait(2000);
        }
        //flag = false;
    }
}).catch(function (err) {
    logger.error(err + '\n' + err.stack, {time: new Date().getTime()});
});
