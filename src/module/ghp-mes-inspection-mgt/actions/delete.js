var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
try {
    var self = this;
    var ans = TMessageBox.question(this, this.ttr("Are you sure to delete selected items?"), '', this.ttr("Delete"),
        [this.ttr('Delete') + ':Yes:Yes:Error', this.ttr('Cancel') + ':Cancel:Cancel:Normal']);
    if (ans != 'Yes') {
        return;
    }
    var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
    var selectCodeLst =  self.selectedItems();
    sql = "SELECT json_data FROM mes_workcenter_param WHERE param_name = 'mes_mobile_inspection' AND workcenter_id = '{0}'";
    sql = _.format(sql, self.uid());
    var paramDataMap = query.selectMap(sql, { json_data: 'json' });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    var jsonDataLst = paramDataMap["json_data"];
    for (var i = 0; i < jsonDataLst.length; i++) {
        var jsonDataMap = jsonDataLst[i];
        if (_.indexOf(selectCodeLst, jsonDataMap["key"]) != -1) {
            jsonDataLst.splice(i, 1);
            i = i - 1;
        }
    }
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
} catch (e) {
    print(e)
}


/*---ACTION---
ICON: "trash"
LABEL: "Delete"
LABEL_ZHCN: "删除"
LABEL_ZHTW: "刪除"
ACCEL: ""
TOOLTIP: ""
TOOLTIP_ZHCN: "删除选中条目"
TOOLTIP_ZHTW: "刪除選中條目"
PERMISSION: "ghp-mes-inspection-mgt-delete"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.selectedDataMaps().length > 0) { return 'enable'; } else { return 'disable'; }"
---ACTION---*/