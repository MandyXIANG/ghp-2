try {
	 this.saveData();	
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "save"
LABEL: "Save"
LABEL_ZHCN: "保存"
LABEL_ZHTW: "保存"
ACCEL: "Ctrl+S"
TOOLTIP: "Save"
TOOLTIP_ZHCN: "保存"
TOOLTIP_ZHTW: "保存"
PERMISSION: "ghp-mes-process-task-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return (this.isDataModified() ) ? 'enable' : 'disable';"
---ACTION---*/