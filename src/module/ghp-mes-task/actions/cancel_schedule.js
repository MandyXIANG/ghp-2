try {
    this.cancelSchedule();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "rotate-left"
LABEL: "Cancel Schedule"
LABEL_ZHCN: "取消排程"
LABEL_ZHTW: "取消排程"
ACCEL: ""
TOOLTIP: "Cancel Schedule"
TOOLTIP_ZHCN: "取消排程"
TOOLTIP_ZHTW: "取消排程"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getStatus('scheduled')) return 'enable';else return 'disable';"
---ACTION---*/