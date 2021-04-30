var self = this;
try {
	var selectMap = self.selectedRows()[0];
	var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
    var selector = new TSqlSelectorV2;
    selector.setTable("mes_prod_process");
    selector.setField(["input_qty", "attr_data->>'diff_qty' AS diff_qty", "output_qty"]);
    selector.setWhere("prod_order_no", selectMap["plan_title"]);
	var processLst = query.selectArrayMap(selector);
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
	for (var i = 0; i < processLst.length; i++) {
		var processMap = processLst[i];
		var inputQty = _.toNumber(processMap["input_qty"]);
		var outputQty = _.toNumber(processMap["output_qty"]);
		var diffQty = _.toNumber(processMap["diff_qty"]);
		if ((inputQty + diffQty - outputQty) > 0) {
			throw self.ttr("The current work order has WIP and cannot be closed!");
		}
	}
	var item = [
		{
			name:'formgridlayout',
			type:'FormGridLayout',
			property:{
				spacing:10,
				margin:10,
				label_alignment: 'AlignRight',
                columns: 1
			},
			child: [
				{
					name:'close_info',
					type:'LineEdit',
					pack:{label:self.ttr('Close Info')},
					validate: 'NOTNULL'
				}
			]
		}
	]
	var ret = GUI.showForm({
        'title': self.ttr('Close'),
        'size': '350x200',
        'items': item,
        'use_core_engine': true,
        "include_hidden_items": true,
        'self': self,
        'buttons': [
            self.ttr('Ok') + ':Ok:Ok:Primary',
            self.ttr('Cancel') + ':Cancel:Cancel:Normal'
        ]
    });
    if (_.isEmpty(ret)) {
        return;
    }
	self.close(ret);	
} catch (e) {
	print(e);
	TMessageBox.error(0, _.toString(e));
}

/*---ACTION---
ICON: "times-circle"
LABEL: "Close"
LABEL_ZHCN: "关闭"
LABEL_ZHTW: "關閉"
ACCEL: ""
TOOLTIP: "Close"
TOOLTIP_ZHCN: "关闭"
TOOLTIP_ZHTW: "關閉"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.selectedRows().length > 0) return 'enable'; else return 'disable';"
---ACTION---*/