
try {

  t.saving(this);
  var self = this;
  var uiloaderObj = this.uiLoader();
  var uiErrStrList = uiloaderObj.validateAll("COMMIT", true, "ERROR");

  if (!_.fuzzyEqual(uiErrStrList.length, 0)) {
    var errStrLst = [];
    for (var errCot = 0; errCot < uiErrStrList.length; errCot++) {
      errStrLst.push(_.toString(uiErrStrList[errCot]["text"]));
    }

    throw errStrLst.join("\n");
  }

  var allDataMap = uiloaderObj.getAllValues(true);

  if (_.isEmpty(allDataMap)) {
    this.unloading();
    return;
  }

  var selectedJob = this.userData("selected_pn");
  var partnumberId = selectedJob.id;

  var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
  query.begin();
  query.updateRow({
    table: "mes_partnumber",
    data: {
      "attr_data" : {
        "product_line" : _.toString(allDataMap["attr_data.product_line"]),
        "pn_raw" : _.toString(allDataMap["attr_data.pn_raw"]),
        "pn_area" : _.toString(allDataMap["attr_data.pn_area"]),
        "scrap_rate" : _.toString(allDataMap["attr_data.scrap_rate"]),
        "rack_type" : _.toString(allDataMap["attr_data.rack_type"]),
        "rack_qty" : _.toString(allDataMap["attr_data.rack_qty"]),
        "rack_count" : _.toString(allDataMap["attr_data.rack_count"])
      }
    },
    where: "id = '" + partnumberId + "'",
    update_policy: {
      "attr_data": "json_merge"
    }
  });
  if (query.lastError().isValid()) {
    query.rollback();
    throw self.ttr("Save data failed") + "!\n" + query.lastError().text();
  }

  query.commit();
  this.unloading();
  // 刷新
  this.dataSaved("");
  self.callAction("refresh");
  self.setDataModified(false);
  self.refreshActionState();
} catch (e) {
  this.unloading();
  GUI.msgbox({ type: this.ttr('Error'), text: this.ttr('Error'), detail: _.toString(e) })
}

/*---ACTION---
ICON: "save"
LABEL: "Save"
LABEL_ZHCN: "保存"
LABEL_ZHTW: "保存"
ACCEL: ""
TOOLTIP: "Save"
TOOLTIP_ZHCN: "保存"
TOOLTIP_ZHTW: "保存"
PERMISSION: "pdm-partnumber-attrs-save"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.isDataModified()){return 'enable';}else{return 'disable';}"
---ACTION---*/


