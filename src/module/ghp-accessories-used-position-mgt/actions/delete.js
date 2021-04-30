try {
	var self = this;
	var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())

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
	
	var selectedItems = this.selectedItems();
	db.begin()
	try {
		db.deleteRow({
            table: "mes_workcenter_param",
            where: {
				id: selectedItems
			}
		})
		if (db.lastError().isValid()) throw db.lastError().text()
		db.commit()
	}
	catch(e) {
		db.rollback()
		throw e
	}
	self.refresh();
} catch (e) {
	print(e);
	GUI.msgbox({title: self.ttr("Error"), text: self.ttr("Delete item failed") + "!", detail: e})
}




/*---ACTION---
ICON: "trash"
LABEL: "Delete"
LABEL_ZHCN: "删除"
LABEL_ZHTW: "删除"
ACCEL: ""
TOOLTIP: "Delete"
TOOLTIP_ZHCN: "删除"
TOOLTIP_ZHTW: "删除"
PERMISSION: ""
CHECKED: ""
GROUP: ""
STYLE: "size=normal button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return this.selectedDataMaps().length > 0 ? 'enable' : 'disable';"
---ACTION---*/