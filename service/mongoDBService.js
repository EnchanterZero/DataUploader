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
logger.info('Mongo url at '+ connUrl);

/**
 * initiation of mongodb
 */
co(function* () {
    var db = yield MongoClient.connect(connUrl);
    yield db.createCollection(collDcmMeta);

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
exports.insert = function*(docArr) {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    yield collection.insertMany(docArr);
    db.close();
}
exports.findAllId = function*() {
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);

    // Insert an array of documents
    var ids = yield collection.distinct('SOPInstanceUID');
    //console.log(ids);
    db.close();
    return ids;
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
exports.find = function*(doclist) {
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

    var docs = yield collection.find({_id:id}).toArray();
    console.log(docs);
    db.close();
    return docs;
}
exports.setDcmsPath = function*(dcms) {
    //console.log('\n\nupdateDcmsPath');
    //console.log(dcms);
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);
    for(var i in dcms){
        var r = yield collection.updateOne({_id: dcms[i]._id},{$set:{dcmPath:dcms[i].dcmPath}});
        //console.log(i + " r.matchedCount  :  " + r.matchedCount);
    }
    //console.log('!!!!!!!!!!');
    db.close();
}
exports.setDcmsSynchronized = function*(dcmUIDs) {
    //console.log('\n\n-------setDcmsSynchronized');
    //console.log(dcmUIDs);
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);
    for(var i in dcmUIDs){
        var r = yield collection.updateOne({_id: dcmUIDs[i]},{$set:{isSynchronized:true}});
        //console.log(i + " r.matchedCount  :  " + r.matchedCount);
    }
    //console.log('!!!!!!!!!!');
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
exports.setSynchronizedDcmsDeleted = function*() {
    //console.log('\n\n-------findSynchronizedLocalDcms');
    var db = yield MongoClient.connect(connUrl);
    // Fetch a collection to insert document into
    var collection = db.collection(collDcmMeta);
    var r = yield collection.updateMany({isSynchronized:true},{$set:{dcmPath:''}});
    //console.log(i + " r.matchedCount  :  " + r.matchedCount);
    //console.log(r);
    db.close();
    return r;
}