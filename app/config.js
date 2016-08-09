import winston from 'winston';
import path from 'path';

/**
 * project config
 */
const projectConfig = {
  projectRoot: __dirname,
};
console.log('Using : ',__dirname);

/**
 * db config
 */
const dbConfig = {
  host: 'localhost',
  port: 3306,
  storage: projectConfig.projectRoot + '/modules/db/database.sqlite',
  username: null,
  password: null,
  database: 'main',
  dialect: 'sqlite',
};

/**
 * logger config
 */
//the directory of the logHomePath must exists
var logHomePath = projectConfig.projectRoot + '/' + 'logs/';
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
      name: 'debug-file',
      filename: logHomePath + 'info.log',
      level: 'debug'
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

export {dbConfig , projectConfig , logger}