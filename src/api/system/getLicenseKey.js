var httpfunc = require('topsin.httpfunc');
var REQ = ARGV.argv().request;
var RES = ARGV.argv().response;
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var fs = require('fs');
var os = require('os');
var Crypto = require('topsin.crypto');
var Moment = require('moment');
try {
    var licensefile = APP.appRootPath() + '/config/license.lic';
    if (!fs.fileExists(licensefile)) throw "license file does not exists!";
    var lic = fs.readFile(licensefile);
    lic = Crypto.decodeBase64(Crypto.decodeBase64(Crypto.decodeBase64(lic))).toString();
    var tmplist = lic.split('|||');
    if (tmplist.length != 2) throw "invalid license file!";
    var serial = tmplist[0];
    var tmplist1 = tmplist[1].split(',');
    var hdinfo = tmplist1[0];
    var expiredate = tmplist1[1];
    if (hdinfo != getHdSerial()) throw "hardware not match!";

    if (_.isEmpty(expiredate)) {
        expiredate = '2999-01-01';
    }
    if (Moment().diff(expiredate, 'h') > 0) throw "license has expired on " + expiredate + '!';
    result.setData(serial);
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}

function getHdSerial() {
    var infolist = [];
    infolist.push(os.name());
    infolist.push(os.version());
    infolist.push(os.arch());
    infolist.push(os.kernelType());
    infolist.push(os.kernelVersion());
    _.forEach(os.networkInterfaces(), function(net){
        if (!_.isEmpty(net.address)) {
            infolist.push(net.mac);
        }
    });
    return Crypto.md5(infolist.join(','));
}

