try {
     this.unlockShift();
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "unlock"
LABEL: "Unlock"
LABEL_ZHCN: "解锁"
LABEL_ZHTW: "解鎖"
ACCEL: "Ctrl+N"
TOOLTIP: "Unlock"
TOOLTIP_ZHCN: "解锁"
TOOLTIP_ZHTW: "解鎖"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.setIsUnlock()){return 'enable'}else{return 'disable'}"
---ACTION---*/