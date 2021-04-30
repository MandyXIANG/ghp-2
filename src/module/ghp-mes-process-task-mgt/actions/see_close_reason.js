try {
	var selectedLst = this.selectedItems();
	print("---selectedLst--" + selectedLst);
	if (selectedLst.length == 0) {
		return;
	}

	var err = new TError;
	var sqlQuery = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
	sqlQuery.begin();

	var selector = new TSqlSelectorV2;
	selector.setTable("mes_prod_order");
	selector.setWhere("id", selectedLst[0]);
	selector.setField("status,action_data->>'close_oper' AS close_oper,action_data->>'close_time' AS close_time, attr_data->>'close_reason' AS close_reason ");
	var planInfoMap = sqlQuery.selectMap(selector);
	if (sqlQuery.lastError().isValid()) {
		throw sqlQuery.lastError().text();
	}
	var curStatus = _.toString(planInfoMap["status"]);
	print("---curStatus--" + curStatus);
	if (curStatus != "closed") {
		throw this.ttr("This task is not closed!");
	}

	var self = this;
	var id = selectedLst[0];
	var ui = {
		name: 'finish_wgt',
		type: 'TabWidget',
		title: self.ttr('Close Reason'),
		child: {
			name: 'product_info_widget',
			type: 'ScrollArea',
			property: { widget_resizable: true, frame_shape: 'QFrame::NoFrame' },
			pack: { label: self.ttr("Close Reason") },

			child: {
				name: 'order_formlayout',
				type: 'FormGridLayout',
				property:
				{
					columns: 1,
					label_alignment: 'AlignTop | AlignRight',
					margin: 20,
					separator: '',
				},
				pack: {},
				child: [
					{
						name: 'close_oper',
						type: 'LineEdit',
						title: self.ttr('Close Person'),
						property: {
							enabled: false
						},
						pack: {
							label: self.ttr('Close Person'),
							column_span: 1
						},
						validate: 'NOTNULL'
					},
					{
						name: 'close_time',
						type: 'DateTimeEdit',
						title: self.ttr('Close Time'),
						property: {
							enabled: false
						},
						pack: {
							label: self.ttr('Close Time'),
							column_span: 1
						},
						validate: 'NOTNULL'
					},
					{
						name: 'close_reason',
						type: 'PlainTextEdit',
						title: self.ttr('Close Reason'),
						property: { vertical_scroll_bar_policy: 'ScrollBarAlwaysOff' },
						pack: { label: self.ttr('Close Reason') },
					},
					{
						name: 'stretcher',
						type: 'Widget',
						property: { size_policy: 'Qt::Expanding' }
					}
				]
			}
		},
	};
	var ret = GUI.showForm({
		title: self.ttr('Close Reason'),
		self: self,
		use_core_engine: true,
		items: ui,
		size: '400x300',
		values: planInfoMap,
		buttons: [
			self.ttr('Ok') + ':Ok:Ok:Primary',
			self.ttr('Cancel') + ':Cancel:Cancel:Normal'
		],
		include_hidden_items: true
	});
	if (_.isEmpty(ret)) {
		return;
	}
	var updater = new TSqlUpdaterV2;
	updater.setTable("mes_prod_order");
	updater.setData({
		"attr_data": {
			"close_reason": ret["close_reason"]
		},
		"action_data": {
			"close_oper": APP.userFullname(),
			"close_time": sqlQuery.getNow()
		}
	});
	updater.setUpdatePolicy({ "attr_data": "json_merge", "action_data": "json_merge" });
	updater.setWhere("id", id);
	sqlQuery.updateRow(updater);
	if (sqlQuery.lastError().isValid()) {
		throw sqlQuery.lastError().text();
	}
	sqlQuery.commit();
	this.refresh();
} catch (e) {
	print(e);
	sqlQuery.rollback();
	this.alertError(this.ttr("See close reason failed!"), e);
}

/*---ACTION---
ICON: "info-circle"
LABEL: "See Close Reason"
LABEL_ZHCN: "关闭原因"
LABEL_ZHTW: "關閉原因"
ACCEL: ""
TOOLTIP: "See Close Reason"
TOOLTIP_ZHCN: "关闭原因"
TOOLTIP_ZHTW: "關閉原因"
PERMISSION: "ghp-mes-process-task-edit"
CHECKED: ""
GROUP: ""
LABEL_EN: ""
LABEL_JP: ""
TOOLTIP_EN: ""
TOOLTIP_JP: ""
STYLE: "button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.selectedItems() > 0 ){return 'enable'}else{return 'disable'}"
---ACTION---*/
