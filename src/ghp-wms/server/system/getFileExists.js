var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture('DBNAME');
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var fs = require('fs');

try {
    var body = JSON.parse(REQ.body());
    var dir = body['dir'];
    var md5list = _.toArray(body['md5']);

    var data = {};
    var isFileExists = function(dir, md5) {
        var datadir = APP.getConfigValue('httpserver.file.storage');
        var filepath = datadir + '/' + DBNAME + '/' + dir + '/' + md5.substring(0,2) + '/' + md5.substring(2,4) + '/' + md5.substring(4,6) + '/' + md5;
        return fs.exists(filepath);
    }
    _.forEach(md5list, function(md5){
        data[md5] = isFileExists(dir, md5);
    });
    result.setData(data);
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}

