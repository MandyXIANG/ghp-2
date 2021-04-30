var self = this;
try {
	var ans = TMessageBox.question(self, self.ttr("After resetting the team, the staff need to swipe the card again. Are you sure to reset?"), '', self.ttr('Reset'),
	  [self.ttr('Reset') + ':Yes:Yes:error', self.ttr('Cancel') + ':Cancel:Cancel:Normal']);
	if (ans != 'Yes') {
	  return;
	}
	self.resetAct();
} catch (e) {
	print(e);
}

/*---ACTION---
ICON: ""
LABEL: "Reset"
LABEL_ZHCN: "重置"
LABEL_ZHTW: "重置"
ACCEL: ""
TOOLTIP: "Reset"
TOOLTIP_ZHCN: "重置"
TOOLTIP_ZHTW: "重置"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.setIsReset() ){return 'enable'}else{return 'disable'}"
---ACTION---*/