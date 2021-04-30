var self = this;
try {
    var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
    sql = "SELECT json_data FROM mes_workcenter_param WHERE param_name = 'mes_mobile_inspection' AND workcenter_id = '{0}'";
    sql = _.format(sql, self.uid());
    var paramDataMap = query.selectMap(sql, { json_data: 'json' });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    var allCodeLst = self.tableView().allPrimaryKey();
    var jsonDataLst = paramDataMap["json_data"];
    var updateDataLst = [];
    for (var i = 0; i < jsonDataLst.length; i++) {
        var jsonDataMap = jsonDataLst[i];
        if (_.indexOf(allCodeLst, jsonDataMap["key"]) != -1) {
            jsonDataLst.splice(i, 1);
            i = i - 1;
            jsonDataMap["seq"] = _.indexOf(allCodeLst, jsonDataMap["key"]);
            updateDataLst.push(jsonDataMap);
        }
    }
    updateDataLst.sort(function(a, b){return a.seq - b.seq});
    jsonDataLst = _.union(jsonDataLst, updateDataLst);
    query.begin();
    query.updateRow({
        table: 'mes_workcenter_param',
        data: {
            json_data: _.toString(jsonDataLst)
        },
        where: {
            param_name: 'mes_mobile_inspection',
            workcenter_id: self.uid()
        }
    });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    query.commit();
    this.refresh();
    this.alertOk(this.ttr("Data saved"));
    self.setUserData("isDataMove", false);
	this.refreshActionState();
} catch (e) {
   print(e);
   TMessageBox.error(0, _.toString(e));
}

/*---ACTION---
ICON: "save"
LABEL: "Save"
LABEL_ZHCN: "保存"
LABEL_ZHTW: "保存"
ACCEL: "Ctrl+S"
TOOLTIP: "Save"
TOOLTIP_ZHCN: "保存"
TOOLTIP_ZHTW: "保存"
PERMISSION: "ghp-mes-inspection-mgt-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.userData('isDataMove')) { return 'enable'; } else { return 'disable'; }"
---ACTION---*/