var httpfunc = require('topsin.httpfunc');
var REQ = ARGV.argv().request;
var RES = ARGV.argv().response;
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var os = require('os');

try {
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
    result.setData(infolist.join(','));
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}

