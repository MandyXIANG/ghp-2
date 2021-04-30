try {
    this.reload();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "cancel"
LABEL: "Cancel"
LABEL_ZHCN: "取消"
LABEL_ZHTW: "取消"
ACCEL: ""
TOOLTIP: "Cancel Edit"
TOOLTIP_ZHCN: "取消编辑"
TOOLTIP_ZHTW: "刷新編輯"
PERMISSION: "ghp-mes-process-task-read"
CHECKED: ""
GROUP: ""
STYLE: "button_style=text"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return (this.isDataModified() ) ? 'enable' : 'hide';"
---ACTION---*/