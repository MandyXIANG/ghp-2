
try {
	var self = this;
	var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
	var selectLst = this.selectedItems();
	if (selectLst.length == 0) {
		return;
	}
	var id = selectLst[0];
	var ans = GUI.msgbox({
		'title':self.ttr('Delete'),
		'text':self.ttr("Are you sure to delete selected items?"),
		'buttons':[
			self.ttr('Delete') + ':Ok:Ok:Primary',
			self.ttr('Cancel') + ':Cancel:Cancel:Error'
		]
	});
	if (ans != 'Ok') { 
        return; 
	}
	db.begin();
	var updater = new TSqlUpdaterV2();
	updater.setTable("sys_user");
	updater.setData({
		"attr_data": {
			"card_code": ""
		},
		"action_data": {
			"delete_time": db.getNow(),
			"delete_oper": APP.userFullname()
		},
		"status": 'deleted'
	});
	updater.setUpdatePolicy({"attr_data":"json_merge"});
	updater.setWhere("id", id);
	db.updateRow(updater);
	if (db.lastError().isValid()) {
		throw db.lastError().text();
	}
	db.commit();
    this.refresh();
} catch(e) {
    print(e);
}

/*---ACTION---
ICON: "close"
LABEL: "Delete"
LABEL_ZHCN: "删除"
LABEL_ZHTW: "刪除"
ACCEL: ""
TOOLTIP: "Delete"
TOOLTIP_ZHCN: "删除"
TOOLTIP_ZHTW: "刪除"
PERMISSION: "ghp-mes-staff-delete"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.selectedItems().length > 0){return 'enable'}else{return 'disable'}"
---ACTION---*/