try{
    var self = this;
    var uid = this.detailUid();
    var selectMap = {};
    var selectLst = this.selectedDataMaps();
    if (!_.isEmpty(selectLst)) {
        selectMap = selectLst[0];
    } else {

    }
    var uiloaderObj = this.uiLoader();
    var uiErrStrList = uiloaderObj.validateAll("COMMIT", true, "ERROR");
  
    if (!_.fuzzyEqual(uiErrStrList.length, 0)) {
      var errStrLst = [];
      for (var errCot = 0; errCot < uiErrStrList.length; errCot++) {
        errStrLst.push(_.toString(uiErrStrList[errCot]["text"]));
      }
  
      self.alertError(self.ttr("Saving data failed!"), errStrLst.join("\n"));
        return;
    }
     

    var allDataMap = uiloaderObj.getAllValues(true);

    if (_.isEmpty(allDataMap)) {
        return;
    }
    var selectquery = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
    selectquery.begin();

    var selector = new TSqlSelectorV2;
    selector.setTable("sys_user");
    selector.setField("fullname");
    selector.addWhere("product_category", "{staffmgt}");
    selector.addWhere("staffid", _.toString(allDataMap["staffid"]))
    var data = selectquery.selectMap(selector);
    if (selectquery.lastError().isValid()) {
        throw selectquery.lastError().text();
    }
    if (Object.keys(data).length > 0 && (_.toString(selectMap["staffid"]) != _.toString(allDataMap["staffid"]))) {
        TMessageBox.error(self, self.ttr("Staff Id") + self.ttr(" already exists"), self.ttr("This staffid has been used by the ") + _.toString(data["fullname"]) + self.ttr(",please correct"), self.ttr("Error"));
        return;
    }

    selector.clear();
    selector.setTable("sys_user");
    selector.setField("fullname");
    selector.addWhere("product_category", "{staffmgt}");
    selector.addWhere("status", "active");
    selector.addWhere("attr_data->>'card_code'", _.toString(allDataMap["attr_data.card_code"]));
    var cardCodeData = selectquery.selectMap(selector);
    if (selectquery.lastError().isValid()) {
		throw selectquery.lastError().text();
    }
    if (Object.keys(cardCodeData).length > 0 && (_.toString(selectMap["attr_data.card_code"]) != _.toString(allDataMap["attr_data.card_code"]))) {
        TMessageBox.error(self, self.ttr("Card Code") + self.ttr(" already exists"), self.ttr("This card_code has been used by the ") + _.toString(cardCodeData["fullname"]) + self.ttr(",please correct"), self.ttr("Error"));
        return;
    }

    selectquery.commit();
    this.saveItem();
} catch(e) {
    print(e);
}



/*---ACTION---
ICON: ""
LABEL: "Save"
LABEL_ZHCN: "保存"
LABEL_ZHTW: "保存"
ACCEL: ""
TOOLTIP: "Save"
TOOLTIP_ZHCN: "保存"
TOOLTIP_ZHTW: "保存"
PERMISSION: "ghp-mes-staff-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=text"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.isDetailModified()) { return 'enable' } else { return 'disable' }"
---ACTION---*/