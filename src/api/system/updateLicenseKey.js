var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var fs = require('fs');

try {
    var license = '';
    if (REQ.method() == "GET") {
        license = REQ.query('license');
    }
    else if (REQ.method() == "POST") {
        var body = JSON.parse(REQ.body());
        license = body['license'];
    }
    if (_.isEmpty(license)) throw "[license] can not be null!";

    var licensefile = APP.appRootPath() + '/config/license.lic';
    if (!fs.writeFile(licensefile, license, 'overwrrite', 'ascii', false)) throw 'write license file failed!';

    result.setData("OK");
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}
