try {
    this.edit();	
} catch (e) {
   print(e);
}

/*---ACTION---
ICON: "edit"
LABEL: "Save"
LABEL_ZHCN: "编辑"
LABEL_ZHTW: "编辑"
ACCEL: "Ctrl+S"
TOOLTIP: "Save"
TOOLTIP_ZHCN: "编辑"
TOOLTIP_ZHTW: "编辑"
PERMISSION: "ghp-mes-accessories-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getMapData('status') != 'draft' && _.toNumber(this.uid()) > 0) {return 'enable';} else return 'hide';"
---ACTION---*/