import * as dcmParse from './dcmParse';
import * as dcmUpload from './dcmUpload';
import * as dcmDiff from './dcmDiff';
import * as serverApi from './serverApi';
import * as AutoScanUpload from './autoScanUpload'
dcmUpload.setInternal(false);
serverApi.setBaseUrl('http://localhost:3000');

export { dcmParse, dcmUpload, serverApi,AutoScanUpload, dcmDiff}