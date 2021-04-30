var self = this;
try {
	self.tableView().moveSelectedRowsTop();
	self.setUserData("isDataMove", true);
	this.refreshActionState();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "angle-double-up"
LABEL: "Move Top"
LABEL_ZHCN: "置顶"
LABEL_ZHTW: "置顶"
ACCEL: ""
TOOLTIP: "Move Top"
TOOLTIP_ZHCN: "置顶"
TOOLTIP_ZHTW: "置顶"
PERMISSION: "ghp-mes-inspection-mgt-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.selectedDataMaps().length > 0) { return 'enable'; } else { return 'disable'; }"
---ACTION---*/