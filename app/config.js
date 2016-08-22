import winston from 'winston';
import fs from 'fs';
import { util } from './util';
import path from 'path';
import os from 'os';

/**
 * project config
 */
const projectConfig = {
  projectRoot: __dirname,
};
console.log('Using : ', __dirname);

/**
 * db config
 */

const dbDir = path.join(os.homedir(),'Library/Application Support/DicomUploader/db');
util.ensureFolderExist(dbDir);
const dbConfig = {
  host: 'localhost',
  port: 3306,
  storage: path.join(dbDir,'database.sqlite'),
  username: null,
  password: null,
  database: 'main',
  dialect: 'sqlite',
};
/**
 * oss config
 */
var Region = function (chName, enName, publicEndpoint, EndpointForECS) {
  this.chName = chName;
  this.enName = enName;
  this.publicEndpoint = publicEndpoint;
  this.internalEndpoint = EndpointForECS;
}
var regions = [
  //          Region中文名称    Region英文表示      外网Endpoint                    ECS访问的内网Endpoint
  new Region('华东 1 (杭州)', 'oss-cn-hangzhou', 'oss-cn-hangzhou.aliyuncs.com', 'oss-cn-hangzhou-internal.aliyuncs.com'),
  new Region('华东 2 (上海)', 'oss-cn-shanghai', 'oss-cn-shanghai.aliyuncs.com', 'oss-cn-shanghai-internal.aliyuncs.com'),
  new Region('华北 1 (青岛)', 'oss-cn-qingdao', 'oss-cn-qingdao.aliyuncs.com', 'oss-cn-qingdao-internal.aliyuncs.com'),
  new Region('华北 2 (北京)', 'oss-cn-beijing', 'oss-cn-beijing.aliyuncs.com', 'oss-cn-beijing-internal.aliyuncs.com'),
  new Region('华南 1 (深圳)', 'oss-cn-shenzhen', 'oss-cn-shenzhen.aliyuncs.com', 'oss-cn-shenzhen-internal.aliyuncs.com'),
  new Region('香港数据中心', 'oss-cn-hongkong', 'oss-cn-hongkong.aliyuncs.com', 'oss-cn-hongkong-internal.aliyuncs.com'),
  new Region('美国硅谷数据中心', 'oss-us-west-1', 'oss-us-west-1.aliyuncs.com', 'oss-us-west-1-internal.aliyuncs.com'),
  new Region('美国弗吉尼亚数据中心', 'oss-us-east-1', 'oss-us-east-1.aliyuncs.com', 'oss-us-east-1-internal.aliyuncs.com'),
  new Region('亚太（新加坡）数据中心', 'oss-ap-southeast-1', 'oss-ap-southeast-1.aliyuncs.com', 'oss-ap-southeast-1-internal.aliyuncs.com')
];
const ossConfig = {
  Bucket: 'curacloud-geno-test',
  Region: regions[2].enName,
}
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

export { dbConfig, projectConfig, ossConfig, logger }