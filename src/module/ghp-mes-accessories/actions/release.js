try {
    this.release();	
} catch (e) {
   print(e);
}

/*---ACTION---
ICON: "save"
LABEL: "Save"
LABEL_ZHCN: "放行"
LABEL_ZHTW: "放行"
ACCEL: "Ctrl+S"
TOOLTIP: "Save"
TOOLTIP_ZHCN: "放行"
TOOLTIP_ZHTW: "放行"
PERMISSION: "ghp-mes-accessories-edit"
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getMapData('status') == 'draft' && _.toNumber(this.uid()) > 0 && (!this.isDataModified())) {return 'enable';} else return 'hide';"
---ACTION---*/