try {
    this.batchStart();
} catch (e) {
    print(e);
    this.alertError(this.ttr("Batch start failed!"), e);
}



/*---ACTION---
ICON: "play-circle"
LABEL: "Batch Start"
LABEL_ZHCN: "批量开工"
LABEL_ZHTW: "批量開工"
ACCEL: ""
TOOLTIP: "Batch Start"
TOOLTIP_ZHCN: "批量开工"
TOOLTIP_ZHTW: "批量開工"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.isBatchStart() ){return 'enable'}else{return 'hide'}"
---ACTION---*/