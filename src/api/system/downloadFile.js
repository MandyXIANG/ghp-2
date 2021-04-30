var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture('DBNAME');
var _ = require('lodash');
var fs = require('fs');

try {
    var md5 = REQ.query('md5');
    var dir = REQ.query('dir');
    var filename = REQ.query('filename');
    if (_.isEmpty(dir)) throw "[dir] can not be null!";
    if (_.isEmpty(md5)) throw "[md5] can not be null!";
    if (_.isEmpty(filename)) throw "[filename] can not be null!";
    var filepath = getFileStorePath(dir, md5);
    if (!fs.fileExists(filepath)) throw filepath + ' not exists!';
    
    RES.file(filepath).withFileDisposition(filename);

}
catch (err) {
    RES.badRequest(_.toString(err));
}

function getFileStorePath(dir, md5) {
    var datadir = APP.getConfigValue('httpserver.file.storage');
    return datadir + '/' + DBNAME + '/' + dir + '/' + md5.substring(0,2) + '/' + md5.substring(2,4) + '/' + md5.substring(4,6) + '/' + md5;
}