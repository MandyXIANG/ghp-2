try {
	this.obsoleteItem();
} catch (e) {
	print(e);
}


/*---ACTION---
ICON: "ban"
LABEL: "Obsolete"
LABEL_ZHCN: "作废"
LABEL_ZHTW: "作廢"
ACCEL: ""
TOOLTIP: "Obsolete"
TOOLTIP_ZHCN: "作废"
TOOLTIP_ZHTW: "作廢"
PERMISSION: "spumes2-mes-accessories-used-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return (this.selectedItems().length > 0) ? 'enable' : 'disable';"
---ACTION---*/