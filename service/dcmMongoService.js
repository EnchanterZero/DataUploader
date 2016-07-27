/**
 * Created by intern07 on 16/7/11.
 */
var mongoose = require('mongoose');
var co = require('co');
var config = require('../config');
var logger = config.logger;

/**
 * settings of mongodb
 */
mongoose.Promise = require('q').Promise;
var SynchronizingStudyModel = require('../models/synchronizingStudy').SynchronizingStudyModel;
var DcmMetaModel = require('../models/dcmMeta').DcmMetaModel;
var connUrl = 'mongodb://' + config.mongodbHost + ':' + config.mongodbPort + '/' + config.mongodbBaseName;

/**
 * mongodb conn
 */
mongoose.connect(connUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  logger.info('MongoDB has connected : ' + connUrl);
});


/**
 *
 * operations of SynchronizingStudy
 *
 */
exports.addSynchronizingStudy = function*(doc) {

  var foundDcm = yield SynchronizingStudyModel.findOne({ _id: doc._id }).exec();
  if (foundDcm) {
    //console.log(foundDcm);
    return false;
  }
  else {
    var SynchronizingStudy = new SynchronizingStudyModel(doc);
    var result = yield SynchronizingStudy.save();
    //console.log(result);
    return true;
  }
}
exports.removeSynchronizingStudy = function*(rmStudyID) {

  var result = yield SynchronizingStudyModel.findOneAndRemove({ _id: rmStudyID });
  return result;

}
exports.removeAllSynchronizingStudyRecords = function*() {
  var result = yield SynchronizingStudyModel.remove({}).exec();
  return result;
}
exports.findSynchronizingStudy = function*() {

  var result = yield SynchronizingStudyModel.find({}).exec();
  return result;
}

/**
 *
 *opreations of dcmMeta
 *
 */
exports.removeAllDcmRecords = function*() {
  yield DcmMetaModel.remove({}).exec();
}
/**
 *
 * @param docArr {Array}
 */
exports.insert = function*(docArr) {
  if (Array.isArray(docArr)) {
    for (var i in docArr) {
      var foundDcm = yield DcmMetaModel.findOne({ _id: docArr[i]._id }).exec();
      if (foundDcm) {
        continue;
      }
      var DcmMeta = new DcmMetaModel(docArr[i]);
      yield DcmMeta.save();
    }
  }
  if (typeof docArr == 'string') {
    var foundDcm = yield DcmMetaModel.findOne({ _id: docArr[i]._id }).exec();
    if (foundDcm) {
      return;
    }
    var DcmMeta = new DcmMetaModel(docArr[i]);
    yield DcmMeta.save();
  }
}
exports.findAllDcmBysyncId = function*(syncId) {
  var docs = yield DcmMetaModel.find({ syncId: syncId }).exec();
  return docs;
}
exports.findAllSynchronizedDcmId = function*() {
  var ids = yield DcmMetaModel.distinct('SOPInstanceUID', { isSynchronized: true }).exec();
  return ids;
}
exports.findAllDcmId = function*() {
  var ids = yield DcmMetaModel.distinct('SOPInstanceUID').exec();
  return ids;
}
exports.findAllSynchronizedStudiesId = function*() {
  var studiesIds = yield DcmMetaModel.distinct('StudyInstanceUID', { isSynchronized: true }).exec();
  return studiesId;
}
exports.findAllStudiesId = function*() {
  var studiesIds = yield DcmMetaModel.distinct('StudyInstanceUID').exec();
  return studiesIds;
}
exports.findAllSynchronizedSeriesId = function*() {
  var seriesIds = yield DcmMetaModel.distinct('StudyInstanceUID', { isSynchronized: true }).exec();
  return seriesIds;
}
exports.findAllSeriesId = function*() {
  var seriesIds = yield DcmMetaModel.distinct('StudyInstanceUID').exec();
  return seriesIds;
}
exports.findAll = function*() {
  var docs = yield DcmMetaModel.find({}).exec();
  return docs;
}
exports.findOne = function*(id) {
  var doc = yield DcmMetaModel.findOne({ _id: id }).exec();
  return doc;
}
/**
 *
 * @param dcms
 * @returns duplicatedDcms {Array}
 */
exports.setDcmsPath = function*(docs) {
  var duplicatedDcmPaths = [];
  for (var i in docs) {
    var foundDcm = yield DcmMetaModel.findOne({ _id: docs[i]._id , syncId: docs[i].syncId, isSynchronized: true }).exec();
    if (foundDcm) {
      duplicatedDcmPaths.push(docs[i].dcmPath);
      continue;
    }
    var r = yield DcmMetaModel.update({ _id: docs[i]._id , syncId: docs[i].syncId}, { dcmPath: docs[i].dcmPath }).exec();
    //console.log(r);
    if (r.nModified == 0) {
      var DcmMeta = new DcmMetaModel(docs[i]);
      yield DcmMeta.save();
    }
  }
  return duplicatedDcmPaths;
}
exports.setDcmsSynchronized = function*(dcmUIDs) {
  for (var i in dcmUIDs) {
    var r = yield DcmMetaModel.update({ _id: dcmUIDs[i] }, { isSynchronized: true }).exec();
  }
}
exports.setDcmSynchronized = function*(dcmUID, syncId) {
  if (!syncId) {
    if (Array.isArray(dcmUID)) {
      for (var i in dcmUID) {
        var r = yield DcmMetaModel.update({ _id: dcmUID[i] }, { isSynchronized: true }).exec();
      }
    }
    if (typeof dcmUID == 'string') {
      var r = yield DcmMetaModel.update({ _id: dcmUID }, { isSynchronized: true }).exec();
    }
  }else{
    if (Array.isArray(dcmUID)) {
      for (var i in dcmUID) {
        var r = yield DcmMetaModel.update({ _id: dcmUID[i] ,syncId:syncId }, { isSynchronized: true }).exec();
      }
    }
    if (typeof dcmUID == 'string') {
      var r = yield DcmMetaModel.update({ _id: dcmUID ,syncId:syncId }, { isSynchronized: true }).exec();
    }
  }
}
exports.setSynchronizedDcmsDeleted = function*(dcmUIDs) {
  for (var i in dcmUIDs) {
    var r = yield DcmMetaModel.update({ _id: dcmUIDs[i] }, { dcmPath: '' }).exec();
    var foundDcm = yield DcmMetaModel.findOne({ _id: dcmUIDs[i], isSynchronized: false, dcmPath: '' }).exec();
    if (foundDcm) {
      throw 'UnsynchronizedDcmSetDeletedError: ' + dcmUIDs[i];
      process.exit();
    }
  }
  db.close();
}
exports.findSynchronizedLocalDcms = function*() {
  var r = yield DcmMetaModel.find({ isSynchronized: true, dcmPath: { $ne: '' } }).exec();
  return r;
}
exports.findAllSynchronizedDcms = function*(synchronizingStudies) {
  var r = yield DcmMetaModel.find({ isSynchronized: true, StudyInstanceUID: { $nin: synchronizingStudies } }).exec();
  return r;
}
exports.setSynchronizedDcmsDeleted = function*() {
  var r = yield DcmMetaModel.update({ isSynchronized: true }, { dcmPath: '' }).exec();
  return r;
}