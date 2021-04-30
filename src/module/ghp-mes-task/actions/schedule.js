try {
    this.schedule();
} catch(e) {
	print(e);
}

/*---ACTION---
ICON: "sort-amount-asc"
LABEL: "Schedule"
LABEL_ZHCN: "排程"
LABEL_ZHTW: "排程"
ACCEL: ""
TOOLTIP: "Schedule"
TOOLTIP_ZHCN: "排程"
TOOLTIP_ZHTW: "排程"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getStatus('ordered')) return 'enable';else return 'disable';"
---ACTION---*/