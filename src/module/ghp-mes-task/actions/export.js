try {
    importPackage("ikm.ole");
    this.loading(this.ttr("Loading..."));

	//获取表格表头配置
	var heardMap = this.getTreeItemLst();

    //获取数据
    var dataMap = this.getCurrentData();
    if(dataMap['isEmpty']) {
		TMessageBox.error(0,this.ttr('Error'),this.ttr('No info can be export'));
		this.unloading();
        return;
    }
	print(_.toString(dataMap));
    //文件名、路径验证
    var fileName = dataMap['date'];
    var fileDlg = new TFileDialog(this.ttr("Save File"),fileName + "生产任务" + ".xlsx");
	fileDlg.setAcceptMode("AcceptSave");
	fileDlg.setNameFilter("*.xlsx");
	var strLst = fileDlg.run();
	path = _.toString(strLst[0]);
	if(path == "")
	{
		this.unloading();
		return;
	}	
	
	if (TFileIo.isFileExist(path)) {
		//检查是否可以被覆盖
		if(!TFileIo.deleteFile(path)) {
			TMessageBox.error(0,this.ttr('Error'),this.ttr("File Cannot be replaced, maybe it's open"));
			this.unloading();
			return;
		}
    }
	
	delete dataMap["isEmpty"];
	delete dataMap["date"];
	var dataLst = [];
	for(var k in dataMap) {
		var workNameMap = {
			"name" : k
		};
		dataLst.push(workNameMap);
		var infoList = dataMap[k];
		for(var i = 0; i < infoList.length; i++) {
			dataLst.push(infoList[i]);
		}
	}
	t.exportExcel(path, heardMap["keyList"], heardMap["heardList"], dataLst);
	this.unloading();
} catch(e) {
	print(e);
	this.unloading();
}

/*---ACTION---
ICON: "export"
LABEL: "Export"
LABEL_ZHCN: "导出"
LABEL_ZHTW: "导出"
ACCEL: ""
TOOLTIP: "Export"
TOOLTIP_ZHCN: "导出"
TOOLTIP_ZHTW: "导出"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/