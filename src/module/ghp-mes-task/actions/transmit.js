try {
	 this.transmit();	
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "terminal"
LABEL: "Transmit"
LABEL_ZHCN: "下达"
LABEL_ZHTW: "下達"
ACCEL: ""
TOOLTIP: "Transmit"
TOOLTIP_ZHCN: "下达"
TOOLTIP_ZHTW: "下達"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getStatus('locked')) return 'enable';else return 'disable';"
---ACTION---*/