try {
	this.leavePost();
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "minus-circle"
LABEL: "Leave Post"
LABEL_ZHCN: "离岗"
LABEL_ZHTW: "離崗"
ACCEL: ""
TOOLTIP: "Leave Post"
TOOLTIP_ZHCN: "离岗"
TOOLTIP_ZHTW: "離崗"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.setBeginLeaveWorkState()) {return 'enable'} else {return 'disable'}"
---ACTION---*/