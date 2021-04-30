try {
	this.startOrder();
} catch (e) {
	print(e);
	this.alertError(this.ttr("This task produce failed!"), e);
}

/*---ACTION---
ICON: "play-circle"
LABEL: "Start Order"
LABEL_ZHCN: "生产"
LABEL_ZHTW: "生產"
ACCEL: ""
TOOLTIP: "Start Order"
TOOLTIP_ZHCN: "生产"
TOOLTIP_ZHTW: "生產"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if ( this.isStartOrder()) {return 'enable'} else {return 'disable'}"
---ACTION---*/