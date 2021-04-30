/**
 * 文档地址: https://toplinker.yuque.com/qmcyl0/slifw7/uprek7
 * 定时调用HR接口更新角色及联系人信息
 * @author donnie.zhu
 */

var xhr = require('topsin.xmlhttprequest');
var parser = require('topsin.parser');
var _ = require('lodash');
var db = require('topsin.database');
var os = require('os');
var fs = require("fs");
var moment = require('moment');
var error = require('topsin.error');
var logger = require('topsin.logger');
var crypto = require('topsin.crypto');
var logger_config = {
    appender: {
        file: {
            'type': 'file',
            'typefilter': 'INFO,SQL,ERROR,WARN,FATAL',
            'format': '{TIME} [{TYPE}]:{MSG}',
            'filename': "/opt/toplinker/witserver/2.2.8/witsrv_devices/sap_sync/log/get_user_info/" + os.getToday() + ".log"
        }
    }
};
logger.loadConfig(logger_config);


//连接数据库
db.addConnection({
    database_type: db.DbType.pg,
    database_host: '192.168.10.11:5432',
    // database_name: 'SPUMES_GHP_V6',
    // database_host: '139.196.104.13:5433',
    database_name: 'TOPMES6_GHP_V6',
    database_user: 'toplinker',
    database_pwd: 'TopLinker0510'
}, "MES_DB");

var MES_DB_QUERY = db.query("MES_DB");
MES_DB_QUERY.begin();

try {
    //验证帐号密码
    var user = 'MSREMOTE';
    var password = 'Mes.19!';

    //参数
    var endDate = os.getToday().toString();
    var werks = '1700';
    var nowTimeStr = MES_DB_QUERY.getNow();

    //数据接口地址
    var url = 'http://192.168.20.12:8000/sap/bc/srt/rfc/sap/zpp010ws_hrinfo/800/zpp010ws_hrinfo/zpp010ws_hrinfo';

    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-type", "text/xml;charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + parser.encodeBase64(user + ":" + password));

    var xmlData = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encodin/" xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
        + '<SOAP-ENV:Body>'
        + '<m:ZPP_GET_PERSON xmlns:m="urn:sap-com:document:sap:rfc:functions">'
        + '<ET_P><item></item></ET_P>'
        + '<IM_DATE>{0}</IM_DATE>'
        + '<IM_WERKS>{1}</IM_WERKS>'
        + '</m:ZPP_GET_PERSON>'
        + '</SOAP-ENV:Body>'
        + '</SOAP-ENV:Envelope>';
    xmlData = _.format(xmlData, endDate, werks);

    xhr.send(xmlData);

    if (xhr.status != 200) {
        throw "return status = " + xhr.status;
    }

    var etPList = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_P')['item'];

    // 查询当前数据库的用户信息
    var mesMap = MES_DB_QUERY.selectMapMap({
        table: 'sys_user',
        field: ['*'],
        field_format: { 'attr_data': 'json' },
        unique_field: 'staffid',
        where: ["staffid not in ('admin')"]
    })

    // 获取接口中的所有工单号，后面处理SAP没有数据，MES有数据的情况
    var sapArr = [];
    _.forEach(etPList, function (perData) {
        var staffid = _.toString(perData.PERNR);
        if (_.toNumber(staffid) == 0) return true;
        sapArr.push(staffid);
        if (_.indexOf(_.keys(mesMap), staffid) == -1) {
            // SAP有 MES没有
            // 直接将人员信息同步到用户管理和联系人管理
            var contactId = MES_DB_QUERY.insertRow({
                table: 'pub_contacts',
                data: {
                    'name': _.toString(perData.ENAME) + '(' + staffid + ')',
                    'sex': _.eq(_.toString(perData.GESCH), '1') ? 'man' : 'women',
                    'source': 'company',
                    'status': 'active',
                    'security_level': '0',
                    'attr_data': {
                        'staffid': staffid,
                        'source': 'SAP'
                    },
                    'extra_data': {
                        'company_code': _.toString(perData.BUKRS),
                        'organization': _.toString(perData.ORGEH),
                        'factory': _.toString(perData.WERKS),
                        'department': _.toString(perData.PDEPT),
                        'position_code': _.toString(perData.PLANS),
                        'position': _.toString(perData.POSIT),
                        'hire_state': _.toString(perData.STAT2),
                        'hire': _.toString(perData.STAT2_T),
                        'hire_date': _.toString(perData.RZDAT),
                        'dimission_date': _.toString(perData.LZDAT),
                        'cost_center': _.toString(perData.KOSTL),
                        'text': _.toString(perData.MCTXT)
                    },
                    'action_data': {
                        'creator': 'admin',
                        'create_time': nowTimeStr
                    }
                },
                auto_increment_field: 'id',
                return_field: 'id'
            })
            if (MES_DB_QUERY.lastError().isValid()) {
                throw MES_DB_QUERY.lastError().text();
            }

            MES_DB_QUERY.insertRow({
                table: 'sys_user',
                data: {
                    'staffid': staffid,
                    'fullname': _.toString(perData.ENAME),
                    'password': crypto.md5('123456'),
                    'status': 'inactive',
                    'contcat_id': contactId,
                    'username': staffid,
                    'attr_data': {
                        'source': 'SAP'
                    },
                    'extra_data': {
                        'company_code': _.toString(perData.BUKRS),
                        'organization': _.toString(perData.ORGEH),
                        'factory': _.toString(perData.WERKS),
                        'department': _.toString(perData.PDEPT),
                        'position_code': _.toString(perData.PLANS),
                        'position': _.toString(perData.POSIT),
                        'hire_state': _.toString(perData.STAT2),
                        'hire': _.toString(perData.STAT2_T),
                        'hire_date': _.toString(perData.RZDAT),
                        'dimission_date': _.toString(perData.LZDAT),
                        'cost_center': _.toString(perData.KOSTL),
                        'text': _.toString(perData.MCTXT)
                    },
                    'action_data': {
                        'creator': 'admin',
                        'create_time': nowTimeStr
                    },
                    'product_category': ['*']
                }
            })
        } else {
            // SAP有 MES有
            MES_DB_QUERY.updateRow({
                table: 'pub_contacts',
                data: {
                    'name': _.toString(perData.ENAME) + '(' + staffid + ')',
                    'sex': _.eq(_.toString(perData.GESCH), '1') ? 'man' : 'women',
                    'source': 'company',
                    'security_level': '0',
                    'attr_data': {
                        'staffid': staffid,
                        'source': 'SAP'
                    },
                    'extra_data': {
                        'company_code': _.toString(perData.BUKRS),
                        'organization': _.toString(perData.ORGEH),
                        'factory': _.toString(perData.WERKS),
                        'department': _.toString(perData.PDEPT),
                        'position_code': _.toString(perData.PLANS),
                        'position': _.toString(perData.POSIT),
                        'hire_state': _.toString(perData.STAT2),
                        'hire': _.toString(perData.STAT2_T),
                        'hire_date': _.toString(perData.RZDAT),
                        'dimission_date': _.toString(perData.LZDAT),
                        'cost_center': _.toString(perData.KOSTL),
                        'text': _.toString(perData.MCTXT)
                    },
                    'action_data': {
                        'last_modify_time': nowTimeStr
                    }
                },
                update_policy: { extra_data: 'json_merge', action_data: 'json_merge', attr_data: 'json_merge' },
                where: { id: _.get(mesMap, [staffid, 'contcat_id']) }
            })
            if (_.get(mesMap, [staffid, 'contcat_id']) == '1427') {
                print('zzz')
            }
            if (MES_DB_QUERY.lastError().isValid()) {
                throw MES_DB_QUERY.lastError().text();
            }

            MES_DB_QUERY.updateRow({
                table: 'sys_user',
                data: {
                    'fullname': _.toString(perData.ENAME),
                    'password': crypto.md5('123456'),
                    'username': staffid,
                    'attr_data': {
                        'source': 'SAP'
                    },
                    'extra_data': {
                        'company_code': _.toString(perData.BUKRS),
                        'organization': _.toString(perData.ORGEH),
                        'factory': _.toString(perData.WERKS),
                        'department': _.toString(perData.PDEPT),
                        'position_code': _.toString(perData.PLANS),
                        'position': _.toString(perData.POSIT),
                        'hire_state': _.toString(perData.STAT2),
                        'hire': _.toString(perData.STAT2_T),
                        'hire_date': _.toString(perData.RZDAT),
                        'dimission_date': _.toString(perData.LZDAT),
                        'cost_center': _.toString(perData.KOSTL),
                        'text': _.toString(perData.MCTXT)
                    },
                    'action_data': {
                        'last_modify_time': nowTimeStr
                    },
                    'product_category': ['*']
                },
                update_policy: { extra_data: 'json_merge', action_data: 'json_merge', attr_data: 'json_merge' },
                where: { staffid: staffid }
            })
            if (MES_DB_QUERY.lastError().isValid()) {
                throw MES_DB_QUERY.lastError().text();
            }
        }
    })

    // 处理SAP没有数据，MES有数据的情况
    var staffidArr = _.difference(_.keys(mesMap), sapArr);
    var contactIdArr = _.map(_.values(mesMap), function (m) {
        if (_.indexOf(staffidArr, m['staffid']) != -1 && !_.eq(_.get(m, ['attr_data', 'source']), 'SAP')) {
            return m['contcat_id']
        }
    })
    contactIdArr = _.filter(contactIdArr, function (o) { return o != null; });
    if (!_.isEmpty(staffidArr)) {
        // 更新用户状态为失效 联系人管理为无效
        MES_DB_QUERY.updateRow({
            table: 'pub_contacts',
            field: ['status', 'action_data'],
            data: {
                'status': 'inactive',
                'action_data': {
                    'last_modify_time': nowTimeStr
                }
            },
            update_policy: { action_data: 'json_merge' },
            where: { id: contactIdArr },
        })
        if (MES_DB_QUERY.lastError().isValid()) {
            throw MES_DB_QUERY.lastError().text();
        }

        MES_DB_QUERY.updateRow({
            table: 'sys_user',
            field: ['status', 'action_data'],
            data: {
                'status': 'inactive',
                'action_data': {
                    'last_modify_time': nowTimeStr
                }
            },
            update_policy: { action_data: 'json_merge' },
            where: { staffid: staffidArr },
        })
        if (MES_DB_QUERY.lastError().isValid()) {
            throw MES_DB_QUERY.lastError().text();
        }

        MES_DB_QUERY.deleteRow({
            table: 'mes_workcenter_certificate',
            where: {
                user_code: staffidArr
            }
        })
    }

    MES_DB_QUERY.replaceRow({
        table: 'pub_conf',
        data: {
            json_data: {
                "run_time": nowTimeStr,
                "result": "OK"
            },
            path: 'get_user_info'
        },
        unique_field: ['path'],
        update_policy: {
            json_data: 'json_merge'
        }
    });
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }
    MES_DB_QUERY.commit();

} catch (error) {
    MES_DB_QUERY.rollback();
    var errMsg = "";
    if (_.eq(typeof (error), "string")) {
        errMsg = error;
    } else {
        errMsg = _.toString(error.message);
    }

    MES_DB_QUERY.replaceRow({
        table: 'pub_conf',
        data: {
            json_data: {
                "result": errMsg,
                "run_time": nowTimeStr,
            },
            path: 'get_user_info'
        },
        unique_field: ['path'],
        update_policy: {
            json_data: 'json_merge'
        }
    });

}


function writeLog(logStr) {
    fs.writeFile('/opt/toplinker/witserver/2.2.8/witsrv_devices/sap_sync/log/' + os.getToday() + 'tmp.log', _.toString(logStr) + '\n', {
        encoding: 'UTF-8',
        append: true,
        withbom: false
    });
}