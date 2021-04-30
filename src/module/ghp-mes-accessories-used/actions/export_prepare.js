try {

    importPackage("ikm.ole");
    self = this;

    Date.prototype.Format = function (fmt) {  
        var o = {  
            "M+": this.getMonth() + 1, //月份   
            "d+": this.getDate(), //日   
            "h+": this.getHours(), //小时   
            "m+": this.getMinutes(), //分   
            "s+": this.getSeconds(), //秒   
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度   
            "S": this.getMilliseconds() //毫秒   
        };  
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));  
        for (var k in o)  
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));  
        return fmt;  
    }

    function numberToColumn(iArgs)
    {
        var retValue;
        var number = valueToNumber(iArgs);
        var aCode = String("A").charCodeAt(0);
        var tmpMod = number % 26;
        retValue = String.fromCharCode(valueToNumber(aCode) + tmpMod);
        number = number - tmpMod;
        if(number > 26 ) {
            var tmpValue = Math.floor(Math.log(number - 26) / Math.log(26));
            while(tmpValue > 2 && number != 0) {
                retValue = "Z" + retValue;
                number = Math.log(number) / Math.log(26);
                tmpValue = Math.floor(Math.log(number - 26) / Math.log(26));
            }
        }
        if(number != 0) {
            tmpMod = Math.ceil(number / 26);
            if(tmpMod) {
                retValue = String.fromCharCode(valueToNumber(aCode) + tmpMod - 1) + retValue;
            }
        }
        return retValue;
    }

    var uiItems =
		{
			name: 'vbox1',
			type: 'VboxLayout',
			property: {},
			pack: {},
			child: [
				{
					name: 'flayout',
					type: 'FormLayout',
					property:
					{
						label_alignment: 'AlignRight',
						separator:":",
						margin: 20,
						vertical_spacing: 10,
						horizontal_spacing: 20
					},
					pack: {},
					child: [
						{
							name: 'start_time',
							type: 'DateEdit',
							title: self.ttr('Start Time'),
							property: {enabled : true},
							pack: {
								label: self.ttr('Start Time')
							},
							validate: function (obj, val, title, moment, self) {
								if(val == '' || val == undefined){
									return [self.ttr('Time cannot be null.'), 'Error']
								}
							}
                        },
                        {
							name: 'end_time',
							type: 'DateEdit',
							title: self.ttr('End Time'),
							property: {enabled : true},
							pack: {
								label: self.ttr('End Time')
							},
							validate: function (obj, val, title, moment, self) {
								if(val == '' || val == undefined){
									return [self.ttr('Time cannot be null.'), 'Error']
								}
							}
						}
					]
				},
				{
					name: 'stretcher',
					type: 'Widget',
					property: { size_policy: 'Expanding' }
				}
			]
		};

		this.loading(self.ttr("Loading..."));
	var ret = GUI.showForm({
		title: this.ttr('Select'),
		self: this,
		items: uiItems,
		include_hidden_items:false,
		values: {
		},
		buttons: [
			self.ttr('Save') + ":Ok:Ok:Primary",
			self.ttr('Cancel') + ":Cancel:Cancel:Normal"
		],
		size: '300x300'
	});
	if (_.isEmpty(ret)) {
		this.unloading();
		return;
    }
    var startStr = _.toString(ret['start_time']);
    var endStr = _.toString(ret['end_time']);
    print("startStr:    " + startStr);
    print("endStr:    " + endStr);

    //取数据
    var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
    var selector = new TSqlSelectorV2;
    selector.setTable("mes_prod_tooling_prepare AS A LEFT JOIN mes_prod_tooling_online AS B ON A.tooling_online_id = B.id");
    selector.setField(['B.workcenter_name','B.partnumber','B.machine_code',
    'B.op_name','B.cutter_position','B.cutter_mnemonic','A.prepare_person','A.prepare_type',
    'A.loaded_status','A.action_time']);
    selector.setWhere('A.action_time',startStr + ' 00:00:00',">=");
    selector.addWhere('A.action_time',endStr + ' 23:59:59',"<=");

    var infoList = db.selectArrayMap(selector);
    if(db.lastError().isValid()){
		this.unloading();
        throw db.lastError().text();
    }
    if(!_.isValid(infoList)){
		this.unloading();
        return;
    }

    if(infoList.length == 0){
		TMessageBox.error(0,self.ttr('Error'),ttr('No info can be export'));
		this.unloading();
        return;
    }

    var dataCount = infoList.length;
    dataCount = _.toString(dataCount);

    var fileName = new Date().Format("yyyy-MM-dd hh-mm-ss");
    var fileDlg = new TFileDialog(this.ttr("Save File"),fileName + "历史备刀记录" + ".xlsx");
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
		var ans = TMessageBox.question(0,self.ttr("File exists, overwrite it?"),path);
		if (ans != "Yes" ) {
			this.unloading();
			return;
		}
		//检查是否可以被覆盖
		if(!TFileIo.deleteFile(path)) {
			this.unloading();
			throw self.ttr("File Cannot be replaced, maybe it's open");
		}
	}

    var excel = new TExcel();
	excel.addBook();
	excel.selectSheet(1);
	excel.openFile(path);

    //写excel
    //头的中文与数据库字段对应---如果动态变化就调用numberToColumn
    var headerTextMap = {
        "workcenter_name" : "A",
        "partnumber" : "B",
        "machine_code" : "C",
        "op_name" : "D",
        "cutter_position" : "E",
        "cutter_mnemonic" : "F",
        "prepare_person" : "G",
        "prepare_type" : "H",
        "loaded_status" : "I",
        "action_time" : "J"
    };

    //写表头
    var titleFont = new Object();
	titleFont["Bold"] = true;
	titleFont["Name"] = "微軟雅黑";
	titleFont["Size"] = 15;
	
	excel.setRangeValue("A2","工作中心名称");
	excel.setRangeValue("B2","机加工号");
	excel.setRangeValue("C2","设备名称");
	excel.setRangeValue("D2","工序名称");
	excel.setRangeValue("E2","刀具位号");
	excel.setRangeValue("F2","刀具助记码");
	excel.setRangeValue("G2","备刀人");
    excel.setRangeValue("H2","备刀类型");
    excel.setRangeValue("I2","是否加载");
    excel.setRangeValue("J2","执行时间");
	
	excel.setRangeFont("A2", titleFont);
	excel.setRangeFont("B2", titleFont);
	excel.setRangeFont("C2", titleFont);
	excel.setRangeFont("D2", titleFont);
	excel.setRangeFont("E2", titleFont);
	excel.setRangeFont("F2", titleFont);
	excel.setRangeFont("G2", titleFont);
    excel.setRangeFont("H2", titleFont);
    excel.setRangeFont("I2", titleFont);
	excel.setRangeFont("J2", titleFont);
	
    //标题栏
	var titleFont = new Object();
	titleFont["Bold"] = true;
	titleFont["Name"] = "微軟雅黑";
	titleFont["Size"] = 20;
	
	var startColum = "A1";
	var endColumn = "J1";
	var mergeRange = startColum + ":" + endColumn;
	excel.mergeRange(mergeRange);
	excel.setRangeValue(mergeRange,"历史备刀记录" + dataCount + "行");
	excel.setRangeHorizontalAlignment(mergeRange, -4108);
	excel.setRangeFont(mergeRange, titleFont);

    //单元格的数字当文本
    excel.setColumnFormat("A","NumberFormatLocal","@");
    excel.setColumnFormat("B","NumberFormatLocal","@");
    excel.setColumnFormat("C","NumberFormatLocal","@");
    excel.setColumnFormat("D","NumberFormatLocal","@");
    excel.setColumnFormat("E","NumberFormatLocal","@");
    excel.setColumnFormat("F","NumberFormatLocal","@");
    excel.setColumnFormat("G","NumberFormatLocal","@");
    excel.setColumnFormat("H","NumberFormatLocal","@");

    //写数据
    var startRow = 3;
    var excelCount = infoList.length;
    for(var i=0;i<infoList.length;i++)
    {
        var obj = {};
        obj = infoList[i];

        var workcenter_name = _.toString(obj["workcenter_name"]);
        var partnumber = _.toString(obj["partnumber"]);
        var machine_code = _.toString(obj["machine_code"]);
        var op_name = _.toString(obj["op_name"]);
        var cutter_position = _.toString(obj["cutter_position"]);
        var cutter_mnemonic = _.toString(obj["cutter_mnemonic"]);
        var prepare_person = _.toString(obj["prepare_person"]);
        var prepare_type = _.toString(obj["prepare_type"]);
        var loaded_status = _.toString(obj["loaded_status"]);
        var action_time = _.toString(obj["action_time"]);

        var tmpRange = "A" + startRow;
        excel.setRangeValue(tmpRange,workcenter_name);

        tmpRange = "B" + startRow;
        excel.setRangeValue(tmpRange,partnumber);

        tmpRange = "C" + startRow;
        excel.setRangeValue(tmpRange,machine_code);

        tmpRange = "D" + startRow;
        excel.setRangeValue(tmpRange,op_name);

        tmpRange = "E" + startRow;
        excel.setRangeValue(tmpRange,cutter_position);

        tmpRange = "F" + startRow;
        excel.setRangeValue(tmpRange,cutter_mnemonic);

        tmpRange = "G" + startRow;
        excel.setRangeValue(tmpRange,prepare_person);

        tmpRange = "H" + startRow;
        excel.setRangeValue(tmpRange,prepare_type);

        tmpRange = "I" + startRow;
        excel.setRangeValue(tmpRange,loaded_status);

        tmpRange = "J" + startRow;
        excel.setRangeValue(tmpRange,action_time);

        startRow++;
    }

    //写结束---------------------------------------------------
    //自适应
    excel.autoFitColumns("A");
	excel.autoFitColumns("B");
	excel.autoFitColumns("C");
	excel.autoFitColumns("D");
	excel.autoFitColumns("E");
	excel.autoFitColumns("F");
	excel.autoFitColumns("G");
    excel.autoFitColumns("H");
    excel.autoFitColumns("I");
	excel.autoFitColumns("J");
	
    //对齐方式
	excel.setColumnHorizontalAlignment("A:J",-4108);
	excel.setColumnVerticalAlignment("A:J",-4108);

    //加边框
    var borderHeadObj = new Object();
	borderHeadObj["LineStyle"] = 1;
	borderHeadObj["ColorIndex"] = -4105;
	borderHeadObj["TintAndShade"] = 0;
	borderHeadObj["Weight"] = 2;
	var borderHeadMap = new Object();
	borderHeadMap["Borders(xlEdgeTop)"] = borderHeadObj;
	borderHeadMap["Borders(xlEdgeRight)"] = borderHeadObj;
	borderHeadMap["Borders(xlEdgeLeft)"] = borderHeadObj;
	borderHeadMap["Borders(xlEdgeBottom)"] = borderHeadObj;
	borderHeadMap["Borders(xlInsideVertical)"] = borderHeadObj;
	borderHeadMap["Borders(xlInsideHorizontal)"] = borderHeadObj;
	
	var endRange = "J" + (excelCount + 2);
	excel.setRangeBorder("A2:" + endRange,borderHeadMap); 
	
    //内容部分设置行高
	var endRow = excelCount + 2;
	excel.setRowHeight(startRow + ":" + endRow,20);

    //保存
    path = path.replace(/\//g,"\\");
	excel.saveAsBook(path);
	excel.quitExcel();
	delete excel;
	
	if(path.indexOf(".xlsx") == -1)
	{
		path += ".xlsx";
	}
	//TLogger.writeLog("path:	" + path);

	if(TFileIo.isFileExist(path))
	{
		var ans = TMessageBox.question(0, "是否打开excel文件");
		ans = _.toString(ans);
		if(ans == "Yes")
		{
			TFileIo.openFile(path);
		}
	}
	this.unloading();

} catch(e) {
	print(e);
	this.unloading();
}


/*---ACTION---
ICON: ""
LABEL: "Export File"
LABEL_ZHCN: "导出"
LABEL_ZHTW: "導出"
ACCEL: ""
TOOLTIP: "Export File"
TOOLTIP_ZHCN: "导出"
TOOLTIP_ZHTW: "導出"
PERMISSION: "spumes2-mes-accessories-used-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return 'hide';"
---ACTION---*/