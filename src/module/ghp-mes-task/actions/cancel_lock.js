try {
	 this.cancelLock();	
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "unlock"
LABEL: "Cancel Lock"
LABEL_ZHCN: "取消锁定"
LABEL_ZHTW: "取消鎖定"
ACCEL: ""
TOOLTIP: "Cancel Lock"
TOOLTIP_ZHCN: "取消锁定"
TOOLTIP_ZHTW: "取消鎖定"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getStatus('locked')) return 'enable';else return 'disable';"
---ACTION---*/