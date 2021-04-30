try {
	this.scanBarcode();
} catch (e) {
	print(e);
	this.alertError(this.ttr("This task produce failed!"), e);
}

/*---ACTION---
ICON: "play-circle"
LABEL: "Scan Barcode"
LABEL_ZHCN: "扫码报工"
LABEL_ZHTW: "掃碼報工"
ACCEL: ""
TOOLTIP: "Scan Barcode"
TOOLTIP_ZHCN: "扫码报工"
TOOLTIP_ZHTW: "掃碼報工"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if ( this.isScanBarcode()) {return 'enable'} else {return 'hide'}"
---ACTION---*/