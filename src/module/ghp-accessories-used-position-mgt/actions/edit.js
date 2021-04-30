try {
    var self = this;
    var selectedDataMap = this.selectedDataMaps()[0];
    var ret = GUI.showForm({
        'title': self.ttr("Edit"),
        'ui': this.ui("new_item"),
        'self': this,
        'use_core_engine': true,
        'size': "500x750",
        'include_hidden_items': true,
        'values': selectedDataMap,
        'buttons': [
            self.ttr('Ok') + ':Ok:Ok:Primary',
            self.ttr('Cancel') + ':Cancel:Cancel:Error'
        ]
    });

    if (_.isEmpty(ret)) return;

    var data = {};
    _.forEach(ret, function (value, key) {
        _.set(data, key, value);
    });

    var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
    query.begin()
    try {
        query.updateRow({
            table: "mes_workcenter_param",
            data: data,
            field: 'json_data',
            where: {
                id: selectedDataMap.id
            }
        })

        if (query.lastError().isValid()) throw query.lastError().text()
        query.commit()
    }
    catch (e) {
        query.rollback()
        throw e
    }
    self.refresh();
} catch (e) {
    print(e);
    GUI.msgbox({ title: self.ttr("Error"), text: self.ttr("Edit item failed") + "!", detail: e })
}

/*---ACTION---
ICON: "edit"
LABEL: "Edit"
LABEL_ZHCN: "编辑"
LABEL_ZHTW: "編輯"
ACCEL: "Edit"
TOOLTIP: "Edit"
TOOLTIP_ZHCN: "编辑"
TOOLTIP_ZHTW: "編輯"
PERMISSION: ""
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.selectedItems().length > 0){return 'enable'}else{return 'disable'}"
---ACTION---*/
