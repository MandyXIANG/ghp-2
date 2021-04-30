try {
     this.lockShift();
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "lock"
LABEL: "Lock"
LABEL_ZHCN: "锁定"
LABEL_ZHTW: "鎖定"
ACCEL: ""
TOOLTIP: "Lock"
TOOLTIP_ZHCN: "锁定"
TOOLTIP_ZHTW: "鎖定"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.setIsLock() ){return 'enable'}else{return 'disable'}"
---ACTION---*/