try {
     this.CreateTasksV2();
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "plus"
LABEL: "Create production tasks"
LABEL_ZHCN: "创建生产任务"
LABEL_ZHTW: "創建生產任務"
ACCEL: "Ctrl+N"
TOOLTIP: "Create production tasks"
TOOLTIP_ZHCN: "创建生产任务"
TOOLTIP_ZHTW: "創建生產任務"
CHECKED: ""
GROUP: ""
LABEL_EN: ""
LABEL_JP: ""
TOOLTIP_EN: ""
TOOLTIP_JP: ""
PERMISSION: "ghp-mes-task-create"
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getStatus()) return 'enable';else return 'disable';"
---ACTION---*/