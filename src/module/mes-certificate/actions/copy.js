try {
    var id = this.uid();
    var selector = new TSqlSelectorV2;
    selector.setTable("mes_workcenter_certificate");
    selector.setField(["position_data", "certificate_data", "remark", "CURRENT_DATE as entry_date"]);
    selector.setFieldFormat({ "position_data": "json", "certificate_data": "json" });
    selector.setWhere("id", id);
    var error = new TError;
    var dataMap = this.runSqlQueryOnThreadSync("TOPSQLTHREAD_SELECT_MAP", selector, error);
    if (error.isValid()) {
        throw error.text();
    }
    var positionData = _.get(dataMap, "position_data", {});
    var positionData2 = _.reduce(positionData, function(prev, v, k) {
        v["start_date"] = dataMap["entry_date"];
        v["end_date"] = dataMap["entry_date"];
        prev[k] = v;
        return prev;
    }, {})
    _.set(dataMap, "position_data", positionData2);
    this.setLastUid(id);
    this.setUid(0);
    this.setData(dataMap);
    this.setTitle(this.ttr("New Item"));
    this.setDataModified(true);
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "copy"
LABEL: "Copy"
LABEL_ZHCN: "复制"
LABEL_ZHTW: "複製"
ACCEL: ""
TOOLTIP: "Copy"
TOOLTIP_ZHCN: "复制"
TOOLTIP_ZHTW: "複製"
PERMISSION: "mes-certificate-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return (this.isDataModified() || this.uid() == 0) ? 'hide' : 'enable';"
---ACTION---*/