var q = require('q');
var co = require('co');
var config = require('../config');
var dcmService = require('../service/dcmService');
var sychronizeService = require('../service/synchronizeService');
var mongoDBService = require('../service/mongoDBService');
var _ = require('lodash');

var logger = config.logger;
var filePath = config.dcmTempDir;
var pullDcmsTopullStudyThreshold = config.pullDcmsTopullStudyThreshold;
var rePushTroubleCountThreshold = config.rePushTroubleCountThreshold;
var rePushTroubleWait = config.rePushTroubleWait;

co(function* () {

  var synchronizingStudies = [];
  var diffID = 1;
  var synchronizeID = 1;

  while(true){


    if(diffID == 1){
      yield sychronizeService.init();
    }
    var diff = yield sychronizeService.getDiff(diffID++);
    var newDcms = diff.newDcms;
    var newDcmsStudiesIds = diff.newDcmsStudiesIds;

    logger.info('########## before:');
    logger.info('---------- synchronizing Studies ['+synchronizingStudies.length+']: '+ synchronizingStudies);
    logger.info('########## new DcmsStudiesIds ['+newDcmsStudiesIds.length+']: '+ newDcmsStudiesIds);
    //synchronizingStudies = _.uniq(synchronizingStudies.concat(newDcmsStudiesIds));

    for(var x in newDcmsStudiesIds){
      (function x(i) {
        co(function*(){
          if(synchronizingStudies.indexOf(newDcmsStudiesIds[i]) == -1){
            var ID = synchronizeID++;
            //将该studyID添加入正在同步的study记录
            synchronizingStudies.push(newDcmsStudiesIds[i]);
            logger.info('########## record added ['+(ID)+']');
            logger.info('---------- synchronizing Studies ['+synchronizingStudies.length+']: '+ synchronizingStudies);
            logger.info('########## new DcmsStudiesIds ['+newDcmsStudiesIds.length+']: '+ newDcmsStudiesIds);
            //执行同步操作
            var SunchronizedStudyID = yield sychronizeService.synchronizeOnce(ID,newDcmsStudiesIds[i]);
            //将该studyID从正在同步的study记录中删除
            //console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   i:' + i);
            var index = synchronizingStudies.indexOf(SunchronizedStudyID);
            if(index > -1){
              synchronizingStudies.splice(index,1);
              logger.info('########## record removed ('+index+') ['+(ID)+']');
              logger.info('---------- synchronizing Studies ['+synchronizingStudies.length+']: '+ synchronizingStudies);
              logger.info('########## new DcmsStudiesIds ['+newDcmsStudiesIds.length+']: '+ newDcmsStudiesIds);


            }
          }else{
          }
        }).catch(function (err) {
          logger.error(err+' : '+err.stack);
        });
      })(x);

    }
  }



  
  
  
  
}).catch(function (err) {
  logger.error(err+'\n'+err.stack,{time:new Date().getTime()});
});
