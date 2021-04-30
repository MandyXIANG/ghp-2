/**
 * 收料保存接口
 * POST请求
 */

var httpfunc = require("topsin.httpfunc");
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var SinEror = require("topsin.error");
var result = new (require("topsin.responsedata"))();
var DB = require("topsin.database");
var DBNAME = REQ.pathCapture("DBNAME");
var Crypto = require("topsin.crypto");
var _ = require("lodash");
var Decimal = require("decimal.js");
var moment = require("moment");

try {
  var details = [];
  var warehouse_code = null;
  var username = null;

  if (REQ.method() !== "POST") {
    throw "Only support POST method!";
  }
  var body = JSON.parse(REQ.body());
  details = body["details"];
  warehouse_code = body["warehouse_code"];
  username = body["username"];

  var data = DB.query(DBNAME, function (q) {
    q.begin();
    try {
      for (var i = 0; i < details.length; i++) {
        var current = details[i];
        var detailInfo = getDetailInfo(q, current.id);
        var sys_data = {};
        sys_data[moment(current.input_time).format("YYYYMMDDHHmmss")] = {
          lot_no: current.input_lot_no,
          prod_date: current.product_time,
          qty: current.current_count,
          time: current.input_time,
        };
        // 1. 更新wms_warehouse_stockin_detail表原来的明细数据

        updateDetail(q, current, sys_data, username, detailInfo);
        // 2.更新该物料该批次的库存信息
        updateInventory(q, current, warehouse_code, username, sys_data);
      }

      q.commit();
      return "success";
    } catch (error) {
      q.rollback();
      throw error;
    }
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.body(result.toJson());
}

/**
 * 获取详情信息
 * @param {*} q
 * @param {*} id
 * @returns
 */

function getDetailInfo(q, id) {
  var map = q.selectMap({
    table: "wms_warehouse_stockin_detail",
    where: {
      id: id,
    },
    field: ["*"],
  });
  if (q.lastError().isValid()) throw q.lastError().text();
  return map;
}

/**
 * 更新明细表信息
 * @param {*} q
 * @param {*} item
 */

function updateDetail(q, item, sys_data, username, detailInfo) {
  var fullname = getFullname(q, username);
  var num = Number(
    Decimal.add(
      parseFloat(detailInfo.actual_bits_count || 0),
      parseFloat(item.current_count)
    )
  );
  q.updateRow({
    table: "wms_warehouse_stockin_detail",
    data: {
      actual_bits_count: num,
      status: num >= item.request_bits_count ? "collected" : "partly_collected",
      sys_data: sys_data,
      action_data: {
        material_receiving_person: fullname,
        material_receiving_person_code: username,
        material_receiving_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      },
    },
    update_policy: {
      sys_data: "json_merge",
      action_data: "json_merge",
    },
    where: {
      id: item["id"],
    },
  });
  if (q.lastError().isValid()) throw q.lastError().text();
}

function updateInventory(q, item, warehouse_code, username, sys_data) {
  var fullname = getFullname(q, username);
  var map = q.selectMap({
    table: "wms_warehouse_inventory",
    where: {
      warehouse_code: warehouse_code,
      material_code: item.material_code,
      lot_no: item.input_lot_no,
    },
    field: ["*"],
  });
  if (q.lastError().isValid()) throw q.lastError().text();
  if (map.id) {
    //更新

    var num = Number(
      Decimal.add(
        parseFloat(map.current_bits_count || 0),
        parseFloat(item.current_count)
      )
    );
    q.updateRow({
      table: "wms_warehouse_inventory",
      data: {
        current_bits_count: num,
        action_data: {
          stockin_update_time: moment().format("YYYY-MM-DD HH:mm:ss"),
          stockin_update_user: fullname,
        },
        sys_data: sys_data,
      },
      update_policy: {
        action_data: "json_merge",
        sys_data: "json_merge",
      },
      where: {
        id: map["id"],
      },
    });
    if (q.lastError().isValid()) throw q.lastError().text();
  } else {
    //新增
    var data = {
      warehouse_code: warehouse_code,
      material_code: item.material_code,
      material_name: item.material_name,
      lot_no: item.input_lot_no,
      stockin_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      current_bits_count: item.current_count,
      bits_units: item.bits_units,
    };

    var action_data = {
      create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      stockin_update_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      stockin_update_user: fullname,
    };
    data["action_data"] = action_data;
    data["sys_data"] = sys_data;

    q.insertRow({
      table: "wms_warehouse_inventory",
      data: data,
      return_field: "id",
    });
    if (q.lastError().isValid()) throw q.lastError().text();
  }
}

/**
 * 获取用户全名
 */

function getFullname(q, username) {
  var name = q.selectValue(
    "SELECT fullname FROM sys_user WHERE username =:receiver",
    {},
    {
      receiver: username,
    }
  );
  if (q.lastError().isValid()) throw q.lastError().text();
  return name;
}
