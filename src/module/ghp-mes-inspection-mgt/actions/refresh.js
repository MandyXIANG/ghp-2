try { 
	this.refresh(false);
	this.refreshActionState();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "refresh"
LABEL: "Refresh"
LABEL_ZHCN: "刷新"
LABEL_ZHTW: "刷新"
ACCEL: "F5"
TOOLTIP: "Reload data from database"
TOOLTIP_ZHCN: "重载数据库数据"
TOOLTIP_ZHTW: "重載數據庫數據"
PERMISSION: "ghp-mes-inspection-mgt-read"
CHECKED: ""
GROUP: ""
STYLE: "button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/