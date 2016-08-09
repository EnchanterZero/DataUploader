import Sequelize from 'sequelize';
import co from 'co';
import Promise from 'bluebird';

import { dbConfig } from '../../config';
import { util } from '../../util';
const logger = util.logger.getLogger('db');
var lib = require('./patch.js');

var dbpath = dbConfig.storage;
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  //dialectModulePath: 'sql.js',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  storage: dbpath
});
sequelize
.authenticate()
.then(function(err) {
  console.log(err);
  console.log('Connection has been established successfully.',dbpath);
})
.catch(function (err) {
  console.log('Unable to connect to the database:', err);
});


function isStringField(fieldType) {
  return fieldType instanceof Sequelize.TEXT
    || fieldType instanceof Sequelize.STRING
    || fieldType instanceof Sequelize.UUIDV1
    || fieldType instanceof Sequelize.UUIDV4;
}

function ensureDBConnection() {
  return co(function*() {
    while (true) {
      try {
        yield sequelize.authenticate();
        break;
      } catch (e) {
        if (e instanceof Sequelize.ValidationError) {
          throw e;
        }
        logger.debug(`sequelize.authenticate failed: ${e.message}`);
        yield Promise.delay(1000);
      }
    }

    yield sequelize.sync({});
    return true;
  });
}

export default sequelize;
export {
  sequelize,
  isStringField,
  ensureDBConnection,
}
