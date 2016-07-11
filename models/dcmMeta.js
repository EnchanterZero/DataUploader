var mongoose = require('mongoose');
var Schema = mongoose.Schema;
/**
 * collDcmMeta :
 * {
    "_id" : "1.3.12.2.1107.5.1.4.74080.30000015082400402627500032022",
    "StudyInstanceUID" : "1.2.840.88888888.3.20150825145012.7421970",
    "SeriesInstanceUID" : "1.3.12.2.1107.5.1.4.74080.30000015082400402627500031888",
    "SOPInstanceUID" : "1.3.12.2.1107.5.1.4.74080.30000015082400402627500032022",
    "dcmPath" : "",
    "isSynchronized" : true
}
 * collSynchronizingStudy :
 * {
    "_id" : "1.2.840.88888888.3.20150825145012.7421970",
    "StudyInstanceUID" : "1.2.840.88888888.3.20150825145012.7421970"
}
 *
 *
 *
 */
var DcmMetaSchema = new Schema({
    _id : String,
    StudyInstanceUID : String,
    SeriesInstanceUID : String,
    SOPInstanceUID : String,
    dcmPath : String,
    isSynchronized : Boolean
},{ collection: 'dcm_meta' });

exports.DcmMetaModel = mongoose.model('DcmMeta', DcmMetaSchema);