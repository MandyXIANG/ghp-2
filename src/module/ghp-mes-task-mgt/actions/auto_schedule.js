try {
     // this.autoSchedule();
     TMessageBox.info(this, "",this.ttr("The feature has not been configured"));
     return ;
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "cubes"
LABEL: "Auto Schedule"
LABEL_ZHCN: "自动排产"
LABEL_ZHTW: "自動排產"
ACCEL: ""
TOOLTIP: "Auto Schedule"
TOOLTIP_ZHCN: "自动排产"
TOOLTIP_ZHTW: "自動排產"
CHECKED: ""
GROUP: ""
LABEL_EN: ""
LABEL_JP: ""
TOOLTIP_EN: ""
TOOLTIP_JP: ""
PERMISSION: "ghp-mes-task-edit"
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/