try {
    this.reload();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "refresh"
LABEL: "Refresh"
LABEL_ZHCN: "刷新"
LABEL_ZHTW: "刷新"
ACCEL: ""
TOOLTIP: "Reload data from database"
TOOLTIP_ZHCN: "重新从数据库加载数据"
TOOLTIP_ZHTW: "重新從數據庫加載數據"
PERMISSION: "ghp-mes-process-task-read"
CHECKED: ""
GROUP: ""
STYLE: "button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return (this.isDataModified() ) ? 'hide' : 'enable';"
---ACTION---*/