var self = this;
try {
	self.tableView().moveSelectedRowsBottom();
	self.setUserData("isDataMove", true);
	this.refreshActionState();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "angle-double-down"
LABEL: "Move Bottom"
LABEL_ZHCN: "置底"
LABEL_ZHTW: "置底"
ACCEL: ""
TOOLTIP: "Move Bottom"
TOOLTIP_ZHCN: "置底"
TOOLTIP_ZHTW: "置底"
PERMISSION: "ghp-mes-inspection-mgt-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.selectedDataMaps().length > 0) { return 'enable'; } else { return 'disable'; }"
---ACTION---*/