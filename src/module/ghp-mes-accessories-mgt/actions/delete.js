try {
	var ans = TMessageBox.question(this, this.ttr("Are you sure to delete selected items?"), '', this.ttr('Ask'));
	if (ans != 'Yes') {
		return;
	}
	this.deleteItem(this.selectedItems());
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "times"
LABEL: "Delete"
LABEL_ZHCN: "刪除"
LABEL_ZHTW: "刪除"
ACCEL: "Delete"
TOOLTIP: "Delete"
TOOLTIP_ZHCN: "删除"
TOOLTIP_ZHTW: "刪除"
PERMISSION: "ghp-mes-accessories-delete"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.selectedItems().length > 0 && this.canModify()){return 'enable'}else{return 'disable'}"
---ACTION---*/