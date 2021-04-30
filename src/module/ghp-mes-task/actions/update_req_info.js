var self = this;
try {
   var dataMapArr = this.selectedRows();
   if (_.isEmpty(dataMapArr)) {
      return;
   }
   var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());

   _.forEach(dataMapArr, function (dataMap) {
      var prodOrderNo = _.get(dataMap, ['plan_title']);
      var processLst = query.selectArrayValue({
         table: 'mes_prod_process',
         field: ['id'],
         value_field: 'id',
         where: { prod_order_no: prodOrderNo }
      })
      if (_.isEmpty(processLst)) return true;
      var param = {
         'prod_order_no': prodOrderNo,
         'prod_process_id': processLst
      };
      var httpUrl = APP.httpUrl();
      httpUrl = _.trimRight(httpUrl, "ikm6");
      var scriptPath = "ghp/";
      var updateUrl = httpUrl + scriptPath + 'ghp-update_request_material_qty';
      var text = httpRequest(updateUrl, param, "ghp-update_request_material_qty");
      text = TDataParse.jsonStr2Variant(text);
      if (_.eq(_.get(text, 'data'), 'ok')) {
         self.alertInfo(self.ttr("Update Successfully"));
      }
   })
} catch (e) {
   print(e);
}


function httpRequest(url, param, apiName) {
   var xhr = new XMLHttpRequest;
   xhr.setRequestHeader('Content-Type', 'application/json');
   xhr.open('POST', url, false);
   xhr.send(JSON.stringify(param));
   if (xhr.status == 200 && xhr.readyState == 4) {
      return xhr.responseText;
   } else {
      throw "_API_ERROR__SEP_" + apiName + "_SEP_" + _.toString(xhr.response);
   }
}

/*---ACTION---
ICON: "arrow-down"
LABEL: "Update Req Info"
LABEL_ZHCN: "更新需求信息"
LABEL_ZHTW: "更新需求信息"
ACCEL: ""
TOOLTIP: "Update Req Info"
TOOLTIP_ZHCN: "更新需求信息"
TOOLTIP_ZHTW: "更新需求信息"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/