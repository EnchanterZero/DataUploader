var express = require('express');
var q = require('q');
var co = require('co');
var config = require('../config');
var dcmService = require('../service/dcmService');
var mongoDBService = require('../service/mongoDBService');
var router = express.Router();

var filepath = config.dcmTempDir;

/* GET home page. */
router.get('/', function (req, res, next) {
    co(function*() {
        //var filepath = '/Users/intern07/Desktop/ZCH_Dicom/20151125-Cardiac^02_CoronaryCTARoutine (Adult)/8-Coro  CorCTA  0.6  B26f  BestDiast 71 %'
        yield dcmService.pushDcms(filepath);
        res.render('index', {title: 'Ready to synchronise'});
        
    }).catch(function (err) {
        console.log(err);
    });

});
router.post('/start', function (req, res, next) {
    co(function*() {
        //---1
        //读取A端所有dcm的UID信息并更新DB
        console.log('\n\n==============  1  读取A端所有dcm的UID信息并更新DB=============')
        console.time('test find all dcms');
        var allDcms = yield dcmService.findAllDcms();
        console.timeEnd('test find all dcms');
        //console.log('\n!!!!! allDcms  :');
        var allDcmsMetas = dcmService.formatDcmForDB(allDcms);
        var ids = yield mongoDBService.findAllId();
        console.log(ids);

        //将本地记录的dcm与A端比较,挑出A端的新纪录,算法有待优化
        var docs = [];
        for (var i in allDcmsMetas) {
            var j;
            for (j = 0; j < ids.length; j++) {
                if (allDcmsMetas[i]._id == ids[j]._id) break;
            }
            if (j == ids.length) docs.push(allDcmsMetas[i]);
        }
        if (docs.length > 0) {
            yield mongoDBService.insert(docs);
        }
        console.log('-----inserted DcmsMetas:  ');
        console.log(docs);

        //---2
        //对于与不在本地且未同步的dcm文件,进行下载
        console.log('\n\n==============  2  对于与不在本地且未同步的dcm文件,进行下载=============')
        for (var i in docs) {
            //retrieveLevel,StudyInstanceUID,SeriesInstanceUID,SOPInstanceUID
            yield dcmService.pullDcms('IMAGE', docs[i].StudyInstanceUID, docs[i].SeriesInstanceUID, docs[i].SOPInstanceUID);
        }


        res.status(200).json({title: 'Found and recorded all new dcms &  Pulled new dcms to local'});


        //yield mongoDBService.findById('1.3.12.2.1107.5.1.4.65381.30000015112208533703900113265');
    }).catch(function (err) {
        console.log(err);
    });

});

router.post('/readdcms', function (req, res, next) {
    co(function*() {

        //---3
        //对于本地的文件(未同步),进行读取信息,并更新DB(dcmPath字段)

        var dcmMetas = yield dcmService.readDcm(filepath);
        console.log(dcmMetas);
        yield mongoDBService.setDcmsPath(dcmMetas);
        res.status(200).json({title: 'Read all local dcms and update records(added dcmPath of local  dcm files )'});
    }).catch(function (err) {
        console.log(err);
    });
});

router.post('/uploaddcms', function (req, res, next) {
    co(function*() {

        //---4
        //对本地的文件(未同步),进行上传,并更新DB中的记录(isSynchronized字段),

        var pushedDcmUIDs = yield dcmService.pushDcms(filepath);
        yield mongoDBService.setDcmsSynchronized(pushedDcmUIDs);

        //---5
        //查找DB中记录,找出本地的已经同步了的dcm files,将这些dcm files 删除,并将相应数据记录的dcmPath置为空串
        var synchronizedLocalDcms = yield mongoDBService.findSynchronizedLocalDcms();
        var dcmPaths = [];
        for(var i in synchronizedLocalDcms){
            dcmPaths.push(synchronizedLocalDcms[i].dcmPath);
        }
        yield dcmService.rmLocalSynchronizedDcms(dcmPaths);
        yield mongoDBService.setSynchronizedDcmsDeleted();

        res.render('index', {title: 'Push all local dcms and update records(set "isSynchronized" to ture) & delete all synchronized dcm files'});
    }).catch(function (err) {
        console.log(err);
    });
});

router.post('/getalldcms', function (req, res, next) {
    co(function*() {

        var dcmFiles = yield dcmService.pullAllDcms();
        res.status(200).json({title: 'Got All Dcms', files: dcmFiles});

    }).catch(function (err) {
        console.log(err);
    });
});

module.exports = router;
