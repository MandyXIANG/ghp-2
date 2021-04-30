try {
	this.beginWork();
} catch (e) {
    print(e);
}

/*---ACTION---
ICON: "plus-circle"
LABEL: "Begin Work"
LABEL_ZHCN: "上岗"
LABEL_ZHTW: "上崗"
ACCEL: ""
TOOLTIP: "Begin Work"
TOOLTIP_ZHCN: "上岗"
TOOLTIP_ZHTW: "上崗"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.setBeginLeaveWorkState()) {return 'enable'} else {return 'disable'}"
---ACTION---*/