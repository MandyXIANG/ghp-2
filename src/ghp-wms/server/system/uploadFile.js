var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture('DBNAME');
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var fs = require('fs');

try {
    var md5 = REQ.query('md5');
    var dir = REQ.query('dir');
    var tmpfile = REQ.bodyFileInfo();
    if (_.isEmpty(dir)) throw "[dir] can not be null!";
    if (_.isEmpty(md5)) {
        var Crypto  = require('topsin.crypto');
        md5 = Crypto.fileMd5(tmpfile.path);
    }

    var destfile = getFileStorePath(dir, md5);
    if (!fs.rename(tmpfile.path, destfile, true)) {
        throw "move file " + tmpfile.path + " to " + destfile + "failed!";
    }
    result.setData({'md5':md5});
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}


function getFileStorePath(dir, md5) {
    var datadir = APP.getConfigValue('httpserver.file.storage');
    return datadir + '/' + DBNAME + '/' + dir + '/' + md5.substring(0,2) + '/' + md5.substring(2,4) + '/' + md5.substring(4,6) + '/' + md5;
}

