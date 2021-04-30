var self = this;
try {
    var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
    var sql = "SELECT id, code, title FROM qc_defect_code WHERE code NOT IN \
        (SELECT json_data->>'key' FROM (SELECT jsonb_array_elements(json_data) AS json_data FROM mes_workcenter_param WHERE param_name = 'mes_mobile_inspection' AND workcenter_id = '{0}') t WHERE json_data->>'key' IS NOT NULL)";
    sql = _.format(sql, self.uid());
    var qcDefectDataLst = query.selectArrayMap(sql, {});
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    var uiDataMap = {
        qc_defect_table: qcDefectDataLst
    }
    var ret = GUI.showForm({
        'title': self.ttr('Please select bad item'),
        'size': '400x400',
        'ui': self.ui("create_item"),
        'use_core_engine': true,
        "include_hidden_items": true,
        'self': self,
        'buttons': [
            self.ttr('Ok') + ':Ok:Ok:Primary',
            self.ttr('Cancel') + ':Cancel:Cancel:Normal'
        ],
        'values': uiDataMap
    });
    if (_.isEmpty(ret)) {
        return;
    }
    var qcDefectDataLst = ret["qc_defect_table"];
    if (_.isEmpty(qcDefectDataLst)) {
        return;
    }
    sql = "SELECT json_data FROM mes_workcenter_param WHERE param_name = 'mes_mobile_inspection' AND workcenter_id = '{0}'";
    sql = _.format(sql, self.uid());
    var paramDataMap = query.selectMap(sql, { json_data: 'json' });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    var seqInt = self.tableView().allDataMap().length;
    var jsonDataLst = paramDataMap["json_data"];
    for (var i = 0; i < qcDefectDataLst.length; i++) {
        var qcDefectDataMap = qcDefectDataLst[i];
        var jsonDataMap = {
            key: qcDefectDataMap["code"],
            count: 0,
            seq: seqInt,
            value: qcDefectDataMap["title"]
        }
        jsonDataLst.push(jsonDataMap);
        seqInt += 1;
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
    self.refresh(true);
    this.refreshActionState();
} catch (e) {
    print(e);
}

/*---ACTION---
ICON: "plus"
LABEL: "Create Design Task"
LABEL_ZHCN: "新建"
LABEL_ZHTW: "新建"
ACCEL: ""
TOOLTIP: "Add new item"
TOOLTIP_ZHCN: "新建条目"
TOOLTIP_ZHTW: "新建條目"
PERMISSION: "ghp-mes-inspection-mgt-create"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/