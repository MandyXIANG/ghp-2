var httpfunc = require("topsin.httpfunc");
var result = new (require("topsin.responsedata"))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require("lodash");
var SinEror = require("topsin.error");
var DB = require("topsin.database");
var DBNAME = REQ.pathCapture("DBNAME");
try {
  if (REQ.method() != "POST") throw "Http method only support POST";
  var body = JSON.parse(REQ.body());
  var code = body["code"];
  var type = body["type"];
  var user_id = body["user_id"];
  if (_.isEmpty(code)) throw "code不能为null";
  if (_.isEmpty(type)) throw "type不能为null";
  var data = DB.query(DBNAME, function (query) {
    /**获取配置文件 */
    var config_sql =
      "select json_data from pub_conf WHERE path = 'app_workcenter_list' ";
    var config = query.selectMap(config_sql, { json_data: "json" }, {});
    var res_data = [],
      final_res = [];
    if (JSON.stringify(config.json_data) !== "{}") {
      var type_ = config.json_data[type]; // 数组
      for (var j = 0; j < type_.length; j++) {
        var element = type_[j];
        for (var item in element) {
          if (item === code) {
            for (var list in element[item]) {
              var obj = element[item][list];
              obj["code"] = list;
              res_data.push(obj);
            }
          }
        }
      }
    }
    var data = res_data;
    // amanda add start
    // 筛选出当前用户拥有权限的工作中心
    data = getWorkcenterUsers(query, res_data);
    data = data.filter(function (o) {
      return o.users.indexOf(user_id) > -1;
    });

    // 获取当前用户拥有权限的模块
    getModelByUser(query, data, user_id);
    data = data.filter(function (item) {
      return item.moudel.length;
    });

    // amanda add end
    if (data.length) {
      /**通过res里面的code 获取对应的name */
      for (var i = 0; i < data.length; i++) {
        var res_sql =
          "SELECT\
        id,name,process_code_list,code \
        FROM\
          mes_workcenter \
        WHERE\
        code ='" +
          data[i].code +
          "'\
        AND (attr_data->>'del_flag' is NULL or attr_data->> 'del_flag' != '1')";
        var res_ = query.selectMap(res_sql, { process_code_list: "array" });
        if (JSON.stringify(data) != "{}") {
          data[i]["id"] = res_["id"];
          data[i]["name"] = res_["name"];
          data[i]["process_code_list"] = res_["process_code_list"];
          final_res.push(data[i]);
        }
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
      }
    }
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    return final_res;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}
/**
 * 获取当前工作中心的所有父级
 */
function getWorkcenterUsers(query, data) {
  var cloneData = JSON.parse(JSON.stringify(data));
  for (var i = 0; i < cloneData.length; i++) {
    var users = []; //当前工作中心以及他的父级拥有的所有用户
    var _role = []; //当前工作中心以及他的父级拥有的所有角色
    var workcenter_ids = []; //工作中心以及他的所有父级
    getItemAuth(query, cloneData[i], users, _role);
    cloneData[i]["users"] = users;
    cloneData[i]["_role"] = _role;
    for (var j = 0; j < _role.length; j++) {
      workcenter_ids.push(_role[j].workcenter_id);
    }
    cloneData[i]["workcenter_ids"] = workcenter_ids;
  }
  return cloneData;
}

function getItemAuth(q, item, users, _role) {
  var sql =
    "select * from mes_workcenter where code = '" +
    item.code +
    "' and (attr_data ->> 'del_flag' = '0' or \
attr_data ->> 'del_flag' is NULL)";
  var obj = q.selectMap(sql, { attr_data: "json" });
  if (q.lastError().isValid()) throw q.lastError().text();
  var element = {
    workcenter_id: obj.id,
    rolelist: obj.attr_data.rolelist,
  };
  _role.push(element);
  if (eval(obj.attr_data.inherit_rolelist) == false) {
    //不继承的工作中心
    var role = obj.attr_data.rolelist;
    for (var i = 0; i < role.length; i++) {
      findUserByRole(q, obj.id, role[i].name, users);
    }
  } else {
    if (eval(obj.attr_data.inherit_rolelist)) {
      //继承角色
      findRole(q, obj.parent_id, _role);
      for (var j = 0; j < _role.length; j++) {
        for (var k = 0; k < _role[j].rolelist.length; k++) {
          var ele = _role[j].rolelist[k];
          findUserByRole(q, _role[j].workcenter_id, ele.name, users);
        }
      }
    }
  }
}

function findRole(q, workcenter_id, _role) {
  var sql =
    "select * from mes_workcenter where id  = " +
    workcenter_id +
    " and (attr_data ->> 'del_flag' = '0' or \
  attr_data ->> 'del_flag' is NULL)";
  var obj = q.selectMap(sql, { attr_data: "json" });
  if (q.lastError().isValid()) throw q.lastError().text();
  var item = {
    workcenter_id: workcenter_id,
    rolelist: obj.attr_data.rolelist,
  };
  // _role = _concat(_role, obj.attr_data.rolelist);
  _role.push(item);
  if (eval(obj.attr_data.inherit_rolelist)) {
    findRole(q, obj.parent_id, _role);
  }
}

function findUserByRole(q, workcenter_id, role, users) {
  var user_sql =
    "select user_id from mes_workcenter_users where workcenter_id = " +
    workcenter_id +
    " and \
  role = '" +
    role +
    "' ";
  var arr = q.selectArrayValue(user_sql, "user_id", {});
  if (q.lastError().isValid()) throw q.lastError().text();
  users = _concat(users, arr);
}

function _concat(arr1, arr2) {
  if (arr2.length) {
    for (var i = 0; i < arr2.length; i++) {
      arr1.push(arr2[i]);
    }
  }
  return arr1;
}

function getModelByUser(query, data, user_id) {
  for (var i = 0; i < data.length; i++) {
    var moudel = data[i].moudel;
    var workcenter_ids = data[i].workcenter_ids;
    var tmp = moudel.filter(function (o) {
      //过滤出有权限的模块
      var roles = data[i][o] || [];
      if (roles.length === 0) {
        //没有配置权限的模块，默认有权限
        return true;
      } else {
        return judgeAuth(query, roles, workcenter_ids, user_id);
      }
    });
    data[i].moudel = tmp;
  }
}

function judgeAuth(query, roles, workcenter_ids, user_id) {
  var sql =
    "select user_id from mes_workcenter_users where workcenter_id in\
  (" +
    workcenter_ids.join(",") +
    ") and role in ('" +
    roles.join("','") +
    "')";
  var user_ids = query.selectArrayValue(sql, "user_id"); // 查询模块配置的角色在当前工作中心或者父级工作中心中的所有用户，只要任意一个用户等于当前用户，则有权限
  if (query.lastError().isValid()) throw query.lastError().text();
  if (user_ids.indexOf(user_id) > -1) {
    return true;
  } else {
    return false;
  }
}
