var self = this;
try {
	self.tableView().moveSelectedRowsDown();
	self.setUserData("isDataMove", true);
	this.refreshActionState();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "angle-down"
LABEL: "Move Down"
LABEL_ZHCN: "下移"
LABEL_ZHTW: "下移"
ACCEL: ""
TOOLTIP: "Move Down"
TOOLTIP_ZHCN: "下移"
TOOLTIP_ZHTW: "下移"
PERMISSION: "ghp-mes-inspection-mgt-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.selectedDataMaps().length > 0) { return 'enable'; } else { return 'disable'; }"
---ACTION---*/