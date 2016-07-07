/**
 * Created by intern07 on 16/6/23.
 */
mongodb = require('mongodb');
var co = require('co');
var config = require('../config');
var logger = config.logger;

/**
 * settings of mongodb
 */
var MongoClient = mongodb.MongoClient;
var connUrl = 'mongodb://' + config.mongodbHost + ':' + config.mongodbPort + '/' + config.mongodbBaseName;
var collDcmMeta = 'dcm_meta';
//var collSynchronizingStudy = 'synchronizing_study';
logger.info('Mongo url at '+ connUrl);

/**
 * initiation of mongodb
 */
co(function* () {
    var db = yield MongoClient.connect(connUrl);
    yield db.createCollection(collDcmMeta);
    //yield db.createCollection(collSynchronizingStudy);

}).catch(function (err) {
    logger.error(err);
});

/**
 * operations
 */
exports.test = function () {
    co(function*() {
        var db = yield MongoClient.connect(connUrl);
        // Fetch a collection to insert document into
        console.log('1');
        var collection = db.collection(collDcmMeta);
        console.log('2');
        // Fetch the document
        var item = yield collection.find().toArray();
        console.log('3');
        console.log(item);
        //test.equal('world_safe2', item.hello);
        db.close();
    });
}
exports.removeAllDcmRecords = function () {
    co(function*() {
        var db = yield MongoClient.connect(connUrl);
        var collection = db.collection(collDcmMeta);
        yield collection.deleteMany({});
        db.close();
    });
}
/**
 * 
 * @param docArr {Array}
 */
exports.insert = function*(docArr) {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);
    for(var i in docArr){
        var foundDcm = yield collection.find({_id:docArr[i]._id}).toArray();
        if(foundDcm.length == 1){
            continue;
        }
        yield collection.insertOne(docArr[i]);
    }

    db.close();
}
exports.findAllSynchronizedDcmId = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    // Insert an array of documents
    var ids = yield collection.distinct('SOPInstanceUID',{isSynchronized:true});
    //console.log(ids);
    db.close();
    return ids;
}
exports.findAllDcmId = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    // Insert an array of documents
    var ids = yield collection.distinct('SOPInstanceUID');
    //console.log(ids);
    db.close();
    return ids;
}
exports.findAllSynchronizedStudiesId = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    // Insert an array of documents
    var studiesId = yield collection.distinct('StudyInstanceUID',{isSynchronized:true});
    //console.log(docs);
    db.close();
    return studiesId;
}
exports.findAllStudiesId = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    // Insert an array of documents
    var studiesId = yield collection.distinct('StudyInstanceUID');
    //console.log(docs);
    db.close();
    return studiesId;
}
exports.findAllSynchronizedSeriesId = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    // Insert an array of documents
    var seriesId = yield collection.distinct('SeriesInstanceUID',{isSynchronized:true});
    //console.log(docs);
    db.close();
    return seriesId;
}
exports.findAllSeriesId = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    // Insert an array of documents
    var seriesId = yield collection.distinct('SeriesInstanceUID');
    //console.log(docs);
    db.close();
    return seriesId;
}
exports.find = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    var docs = yield collection.find().toArray();

    db.close();
    return docs;
}
exports.findOne = function*(id) {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    var doc = yield collection.find({_id:id}).toArray();
    console.log(doc);
    db.close();
    return doc;
}
/**
 * 
 * @param dcms
 * @returns duplicatedDcms {Array}
 */
exports.setDcmsPath = function*(dcms) {
    //console.log('\n\nupdateDcmsPath');
    //console.log(dcms);
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);
    var duplicatedDcmPaths = [];
    for(var i in dcms){
        var foundDcm = yield collection.find({_id:dcms[i]._id,isSynchronized:true}).toArray();
        if(foundDcm.length == 1){
            //console.log('found duplicatedDcm:['+i+']:');
            //console.log(foundDcm);
            duplicatedDcmPaths.push(dcms[i].dcmPath);
            continue;
        }
        var r = yield collection.updateOne({_id: dcms[i]._id},{$set:{dcmPath:dcms[i].dcmPath}});
        if(r.matchedCount ==0){
            yield collection.insertOne(dcms[i]);
        }
    }
    //console.log('!!!!!!!!!!');
    db.close();
    return duplicatedDcmPaths;
}
exports.setDcmsSynchronized = function*(dcmUIDs) {
    var db = yield MongoClient.connect(connUrl);
    var collection = db.collection(collDcmMeta);
    for(var i in dcmUIDs){
        var r = yield collection.updateOne({_id: dcmUIDs[i]},{$set:{isSynchronized:true}});
    }
    db.close();
}
exports.setSynchronizedDcmsDeleted = function*(dcmUIDs) {
    var db = yield MongoClient.connect(connUrl);
    var collection = db.collection(collDcmMeta);
    for(var i in dcmUIDs){
        var r = yield collection.updateOne({_id: dcmUIDs[i]},{$set:{dcmPath:''}});
        var foundDcm = yield collection.find({_id:dcmUIDs[i],isSynchronized:true,dcmPath:''}).toArray();
        if(foundDcm.length == 1){
            throw 'UnsynchronizedDcmSetDeletedError: '+dcmUIDs[i];
        }
    }
    db.close();
}
exports.findSynchronizedLocalDcms = function*() {
    //console.log('\n\n-------findSynchronizedLocalDcms');
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);
    var r = yield collection.find({isSynchronized:true,dcmPath:{$ne:''}}).toArray();
    //console.log(i + " r.matchedCount  :  " + r.matchedCount);
    //console.log(r);
    db.close();
    return r;
}
exports.findAllSynchronizedDcms = function*() {
    //console.log('\n\n-------findSynchronizedLocalDcms');
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);
    var r = yield collection.find({isSynchronized:true}).toArray();
    //console.log(i + " r.matchedCount  :  " + r.matchedCount);
    //console.log(r);
    db.close();
    return r;
}
exports.setSynchronizedDcmsDeleted = function*() {
    var db = yield MongoClient.connect(connUrl);
    var collection = db.collection(collDcmMeta);
    var r = yield collection.updateMany({isSynchronized:true},{$set:{dcmPath:''}});
    db.close();
    return r;
}