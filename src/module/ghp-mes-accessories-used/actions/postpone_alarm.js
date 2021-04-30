try {
	this.postponeAlarm();
} catch (e) {
	print(e);
}


/*---ACTION---
ICON: "edit"
LABEL: "Postpone Alarm"
LABEL_ZHCN: "暂缓报警"
LABEL_ZHTW: "暫緩報警"
ACCEL: ""
TOOLTIP: "Postpone Alarm"
TOOLTIP_ZHCN: "暂缓报警"
TOOLTIP_ZHTW: "暫緩報警"
PERMISSION: "spumes2-mes-accessories-used-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return (this.selectedItems().length > 0) ? 'enable' : 'disable';"
---ACTION---*/