var self = this;
try {
	self.tableView().moveSelectedRowsUp();
	self.setUserData("isDataMove", true);
	this.refreshActionState();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "angle-up"
LABEL: "Move Up"
LABEL_ZHCN: "上移"
LABEL_ZHTW: "上移"
ACCEL: ""
TOOLTIP: "Move Up"
TOOLTIP_ZHCN: "上移"
TOOLTIP_ZHTW: "上移"
PERMISSION: "ghp-mes-inspection-mgt-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.selectedDataMaps().length > 0) { return 'enable'; } else { return 'disable'; }"
---ACTION---*/