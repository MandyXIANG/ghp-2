try {
    this.copy();
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: "copy"
LABEL: "Copy"
LABEL_ZHCN: "复制"
LABEL_ZHTW: "複製"
ACCEL: ""
TOOLTIP: "Copy"
TOOLTIP_ZHCN: "复制"
TOOLTIP_ZHTW: "複製"
PERMISSION: "ghp-mes-accessories-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return (this.isDataModified() || this.uid() == 0) ? 'hide' : 'enable';"
---ACTION---*/