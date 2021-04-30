try {

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

	var self = this;
	var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());

	var workcenterList = self.getWorkcenterInfo("work_center", true);
	// print("=======workcenterList======" + JSON.stringify(workcenterList));	

	function getTableDataList(iSqlArgMap) {
		// print("=======iSqlArgMap======" + JSON.stringify(iSqlArgMap));
		//{"end_time":"2019-12-11 14:26:31","start_time":"2019-12-11 14:26:30","workcenter":"GF003_02","site":"1#","prepare_person":"admin","info_table":[]}
		var selector = new TSqlSelectorV2;
		selector.setTable('mes_prod_online_record AS RECORD LEFT JOIN mes_workcenter AS WORKCENTER ON RECORD.workcenter_id = WORKCENTER.id');
		selector.setField(["RECORD.id", "WORKCENTER.code AS workcenter_code", "WORKCENTER.name AS workcenter_name",
			"RECORD.prepare_type", "RECORD.partnumber", "RECORD.extra_data->>'partnumber_name' AS partnumber_name",
			"RECORD.prepare_time", "RECORD.site", "RECORD.count", "RECORD.lot_no", "RECORD.prepare_person"]);
		if (!_.isEmpty(_.toString(iSqlArgMap["workcenter"]))) {
			selector.addWhere("WORKCENTER.code", _.toString(iSqlArgMap["workcenter"]));
		}
		if (!_.isEmpty(_.toString(iSqlArgMap["site"]))) {
			selector.addWhere("RECORD.site", _.toString(iSqlArgMap["site"]));
		}
		if (!_.isEmpty(_.toString(iSqlArgMap["prepare_person"]))) {
			selector.addWhere("RECORD.prepare_person", _.toString(iSqlArgMap["prepare_person"]));
		}
		if (!_.isEmpty(_.toString(iSqlArgMap["start_time"]))) {
			selector.addWhere("RECORD.prepare_time", _.toString(iSqlArgMap["start_time"]), ">=");
		}
		if (!_.isEmpty(_.toString(iSqlArgMap["end_time"]))) {
			selector.addWhere("RECORD.prepare_time", _.toString(iSqlArgMap["end_time"]), "<=");
		}
		selector.setOrder("RECORD.id", 1);

		var dbDataList = db.selectArrayMap(selector)
		var err = db.lastError(); if (err.isValid()) {
			GUI.msgbox({ type: "ERROR", text: self.ttr("Load data failed!"), detail: err.text() });
			return [];
		}
		var enumMap = {
			'prepare_type': "spumes2-mes-share-accessories-type"
		}
		_.forEach(dbDataList, function (v) {
			_.forEach(enumMap, function (v2, k2) {
				var text = TOPENM.enumList(v2).itemText(v[k2]);
				v[k2 + '.text'] = text;
			})
		});

		return dbDataList;

	}

	var ui = {
		name: "splitter",
		type: "Splitter",
		property:
		{
			children_collapsible: false,
			orientation: "Horizontal",
			stylesheet: "QSplitter::handle{background:#D5D5D5}"
		},
		child: [
			{
				name: 'navi_wgt',
				type: 'Widget',
				property: { maximum_width: 300 },
				pack: {},
				child: [
					{
						name: 'flayout',
						type: 'FormGridLayout',
						property: { label_alignment: 'AlignRight', margin: 10, vertical_spacing: 10, horizontal_spacing: 10 },
						pack: {},
						child: [
							// 工作中心 
							{
								name: 'workcenter',
								type: 'ComboBox',
								title: self.ttr('Workcenter Info'),
								property: { item_list: workcenterList },
								pack:
								{
									label: self.ttr('Workcenter Info')
								},

							},

							// 开始时间
							{
								name: "start_time",
								title: self.ttr("Start Time"),
								type: "DateTimeEdit",
								property: {
								},								
							},

							// 结束时间
							{
								name: "end_time",
								title: self.ttr("End Time"),
								type: "DateTimeEdit",
								property: {
								},
								pack: {},
								state: function (obj, self) {
								},
							},

							// 槽位
							{
								name: "site",
								title: self.ttr("Site"),
								type: "ComboBox",
								property: {
									item_list: [{ name: "1#", text: "1#" },
									{ name: "2#", text: "2#" },
									{ name: "3#", text: "3#" },
									{ name: "4#", text: "4#" },
									{ name: "5#", text: "5#" },
									{ name: "17#", text: "17#" },
									{ name: "18#", text: "18#" },
									{ name: "19#", text: "19#" }]
								},
								pack: {},
								state: function (obj, self) {
								}
							},

							// 执行人员
							{
								name: "prepare_person",
								title: self.ttr("Prepare Person"),
								type: "LineEdit",
								property: {
								},
								pack: {},
								state: function (obj, self) {
								}
							},
							{
								name: 'btn_list',
								type: 'HBoxLayout',
								property: { spacing: 0, margin: 0 },
								pack: {
									column_span: 1
								},
								child: [
									{
										name: 'btnBrush',
										type: 'PushButton',
										pack:
										{
										},
										property:
										{
											text: self.ttr('Brush'), icon: 'eraser'
										},
										validate: function (obj, val, title, moment, self) {
										},
										callback: function (obj, clicked, self) {
											this.clearValues();
											this.setValue("info_table", []);
										}
									},
									{
										name: 'btn',
										type: 'PushButton',
										pack:
										{
										},
										property:
										{
											text: self.ttr('Search'), icon: 'search'
										},
										validate: function (obj, val, title, moment, self) {

										},
										callback: function (obj, clicked, self) {
											// print("==btn==" + JSON.stringify(this.getAllValues(true)));
											var dataLst = getTableDataList(this.getAllValues(true));
											// print("==hostLst==" + JSON.stringify(hostLst));
											this.setValue("info_table", dataLst);
											this.setValue("export_info", self.ttr("Total Length : ") + dataLst.length);
										}
									},
								]
							},
							{
								name: 'stretcher',
								type: 'Stretch'
							},
							{
								name: 'export_info',
								type: 'PlainTextEdit',
								title: self.ttr("Export Info"),
								property: {
									enabled: false,
									vertical_scroll_bar_policy: 'ScrollBarAlwaysOff',
									accept_rich_text: false,
									min_row_count: 2,
									max_row_count: 2
								}
							},
						]
					},
					{
						type: 'stretch'
					}
				]
			},
			{
				name: 'info_wgt',
				type: 'Widget',
				property: {},
				pack: {},
				child: [
					{
						name: 'v_layout',
						type: 'VBoxLayout',
						property: { spacing: 0, margin: 0 },
						pack: {},
						child: [
							{
								name: 'toolbar',
								type: "ToolBar",
								child: [
									{
										name: 'export',
										type: 'Action',
										property: { text: self.ttr("Export"), icon: "export", tooltip: self.ttr("Export") },
										callback: function (obj, clicked, self) {
											print("export----------");
											importPackage("ikm.ole");
											try {


												function getOutFilePath(iExcelFileName, iFullYear) {
													var iExcelFileName = "";
													if (iExcelFileName == "") {
														iExcelFileName = iFullYear + ".xlsx";
													}
													else {
														iExcelFileName = iExcelFileName + ".xlsx";
													}
													var savePath = "";
													var fileDlg = new TFileDialog(self.ttr("Save File"), iExcelFileName);
													fileDlg.setAcceptMode("AcceptSave");
													fileDlg.setNameFilter("*.xlsx");
													var strLst = fileDlg.run();
													if (strLst.length) {
														savePath = strLst[0];
													}

													if (savePath == "") {
														return;
													}
													savePath = savePath.replace(/\//g, "\\");

													//补上文件后缀
													if (savePath.indexOf(".xlsx") == -1) {
														savePath = savePath + ".xlsx";
													}

													if (TFileIo.isFileExist(savePath)) {
														//检查是否可以被覆盖
														if (!TFileIo.deleteFile(savePath)) {
															throw self.ttr("File Cannot be replaced, maybe it's open");
															// return;
														}
													}

													return savePath;
												}

												var excelInfoList = this.getValue("info_table");
												print("====excelInfoList===" + excelInfoList.length);
												// print("====excelInfoList===" + TDataParse.variant2JsonStr(excelInfoList));
												if (!_.isValid(excelInfoList) || (_.fuzzyEqual(excelInfoList.length, 0))) {
													return;
												}
												var excelTitleList = this.getObject("info_table").headerItem();
												// var excelDataLst = excelInfoMap["data"];
												if (!_.isValid(excelTitleList) || _.fuzzyEqual(excelTitleList.length, 0)) {
													return;
												}


												var excelFeildTitleLst = [];
												var excelFeildNameLst = [];
												for (var i = 0; i < excelTitleList.length; i++) {
													var eleMap = excelTitleList[i];
													if (!_.isValid(eleMap) || (_.toString(eleMap["name"]) == "")) {
														continue;
													}
													excelFeildNameLst.push(_.toString(eleMap["displayRole"]).replace("$", ""));
													excelFeildTitleLst.push(_.toString(eleMap["display"]));
												}


												// print("==excelFeildNameLst======" + excelFeildNameLst);
												// print("==excelFeildTitleLst======" + excelFeildTitleLst);

												var excel = new TExcel();
												//获取输出路径
												var fileName = new Date().Format("yyyy-MM-dd hhmmss") + "_" + self.ttr("Used Log");
												var outputFilePath = getOutFilePath("", fileName);
												if ((outputFilePath == '') || (outputFilePath == undefined)) {
													excel.quitExcel();
													return;
												}

												excel.addBook();
												var newPath = outputFilePath.replace("/", "\\");
												excel.saveAsBook(newPath);
												// print("====newPath===" + newPath);

												var isExcelOpen = excel.openFile(outputFilePath);
												if ((isExcelOpen == undefined) || (isExcelOpen == null)) {
													TMessageBox.warning(this, self.ttr("Can't find report file"), '', self.ttr('Warning'));
													excel.quitExcel();
													return;
												}
												this.setValue("export_info", self.ttr("Total Length : ") + excelInfoList.length + "\n" + self.ttr("Exporting data..."));
												this.getObject("info_table").setEnabled(false);
												// excel.setExcelVisible(true);

												excel.setSheetName(1, self.ttr("Used Log"));
												excel.selectSheet(1);

												var titleFont = new Object();
												titleFont["Bold"] = true;
												titleFont["Name"] = "微軟雅黑";
												titleFont["Size"] = 15;
												for (var fieldCot = 0; fieldCot < excelFeildTitleLst.length; fieldCot++) {
													//excel 标题
													excel.setCellValue(excel.getCell(1, fieldCot + 1), _.toString(excelFeildTitleLst[fieldCot]));
													excel.setRangeHorizontalAlignment(excel.getCellAddress(excel.getCell(1, fieldCot + 1)), -4108);
													excel.setRangeFont(excel.getCellAddress(excel.getCell(1, fieldCot + 1)), titleFont);

												}

												var typeEnum = TOPENM.enumList("spumes2-mes-share-accessories-type");
												var excelDataCot = 0;
												for (var dataCot = 0; dataCot < excelInfoList.length; dataCot++) {
													this.setValue("export_info", self.ttr("Total Length : ") + excelInfoList.length + "\n" + self.ttr("Exporting") + " " + _.toString(dataCot + 1) + " " + self.ttr("Data"));

													for (var fieldCot = 0; fieldCot < excelFeildNameLst.length; fieldCot++) {
														//excel 数据
														// print("========excelDataCot=====" + excelDataCot);
														if (_.toString(excelFeildNameLst[fieldCot]) == "prepare_type") {
															excel.setCellValue(excel.getCell(2 + excelDataCot, fieldCot + 1), _.toString(typeEnum.itemText(_.toString(excelInfoList[dataCot][_.toString(excelFeildNameLst[fieldCot])]))));
														}
														else {
															excel.setCellValue(excel.getCell(2 + excelDataCot, fieldCot + 1), _.toString(excelInfoList[dataCot][_.toString(excelFeildNameLst[fieldCot])]));
														}
														excel.setRangeHorizontalAlignment(excel.getCellAddress(excel.getCell(2 + excelDataCot, fieldCot + 1)), -4108);
													}
													excelDataCot += 1;
												}


												for (var k = 0; k < excelFeildNameLst.length; k++) {
													if (_.fuzzyLessThan(k, 26)) {
														excel.autoFitColumns(String.fromCharCode(_.toNumber(65 + k)));
													}
													else {
														excel.autoFitColumns(String.fromCharCode(_.toNumber(65 + k / 26 - 1)) + String.fromCharCode(_.toNumber(65 + k % 26)));
													}

													// print("==column======"+ k  + " "+ String.fromCharCode(_.toNumber(65 + k)) + " " + String.fromCharCode(_.toNumber(65 + k / 26 - 1)) + String.fromCharCode(_.toNumber(65 + k % 26)));
												}

												var row = excel.getUsedRows();
												var borderHeadObj = new Object();
												borderHeadObj["LineStyle"] = 1;
												borderHeadObj["ColorIndex"] = -4105;
												borderHeadObj["TintAndShade"] = 0;
												borderHeadObj["Weight"] = 2;

												// print("========range=====" + "A1:K" + _.toString(row));
												// print("==setRangeBorder======" + String.fromCharCode(_.toNumber(65 + excelFeildNameLst.length - 1)));

												if (_.fuzzyLessThan(excelFeildNameLst.length, 26)) {
													excel.setRangeBorder("A1:" + String.fromCharCode(_.toNumber(65 + excelFeildNameLst.length - 1)) + _.toString(row), borderHeadObj);
												}
												else {
													excel.setRangeBorder("A1:" + String.fromCharCode(_.toNumber(65 + excelFeildNameLst.length / 26 - 1)) + String.fromCharCode(_.toNumber(65 + excelFeildNameLst.length % 26 - 1)) + _.toString(row), borderHeadObj);
												}

												print("outputFilePath:  " + outputFilePath);
												excel.selectSheet(1);

												excel.saveBook();
												excel.quitExcel();
												delete excel;
												this.getObject("info_table").setEnabled(true);

												if (outputFilePath.indexOf(".xlsx") == -1) {
													outputFilePath += ".xlsx";
												}

												if (TFileIo.isFileExist(outputFilePath)) {
													var ans = TMessageBox.question(0, self.ttr("Do you want to open this excel file?"));
													ans = _.toString(ans);
													if (ans == "Yes") {
														TFileIo.openFile(outputFilePath);
													}
												}

											} catch (e) {
												print(e);
												this.getObject("info_table").setEnabled(true);
												this.setValue("export_info", self.ttr("Total Length : ") + excelInfoList.length + "\n" + self.ttr("Export data finish!"));

												if (_.isValid(excel)) {
													excel.quitExcel();
													delete excel;
												}
												GUI.msgbox({ type: 'ERROR', title: self.ttr("Error"), text: self.ttr("Export data failed!"), detail: e });
											}
										}
									}
								]
							},
							{
								name: 'info_table',
								type: 'TableView',
								property: {},
								pack: { label: self.ttr("Information") },
								setter: function (obj, value) {
									if (value == null) {
										value = [];
									}
									obj.loadData(value);
								},
								getter: function (obj, self) {
									//return obj.allDataMap();
									var list = obj.allDataMap();
									return list;
								},
								initCallback: function (obj) {
									obj.setHeaderItem(
										[
											{

											},
											{
												"name": "workcenter_name",
												"display": self.ttr("Workcenter Name"),
												"displayRole": "$workcenter_name",
												"resizeMode": "Interactive",
												"search": "string",
												"size": 120
											},
											{
												"name": "prepare_type",
												"display": self.ttr("Accessories Type"),
												"displayRole": "$prepare_type.text",
												"decorationRole": "$prepare_type.icon",
												"resizeMode": "Interactive"
											},
											{
												"name": "partnumber",
												"display": self.ttr("Accessories Code"),
												"displayRole": "$partnumber",
												"resizeMode": "Interactive"
											},
											{
												"name": "partnumber_name",
												"display": self.ttr("Accessories Name"),
												"displayRole": "$partnumber_name",
												"resizeMode": "Interactive"
											},
											{
												"name": "prepare_time",
												"display": self.ttr("Input Time"),
												"displayRole": "$prepare_time",
												"resizeMode": "Interactive",
												"size": 180
											},
											{
												"name": "site",
												"display": self.ttr("Using position"),
												"displayRole": "$site",
												"resizeMode": "Interactive"
											},
											{
												"name": "count",
												"display": self.ttr("Using Count"),
												"displayRole": "$count",
												"resizeMode": "Interactive"
											},
											{
												"name": "lot_no",
												"display": self.ttr("Lot No"),
												"displayRole": "$lot_no",
												"resizeMode": "Interactive"
											},
											{
												"name": "prepare_person",
												"display": self.ttr("Prepare Person"),
												"displayRole": "$prepare_person",
												"resizeMode": "Interactive"
											}
										]);
									obj.setDataKeyList(["id", "workcenter_code", "workcenter_name", "prepare_type", "prepare_type.text",
										"prepare_type.icon", "partnumber", "partnumber_name",
										"prepare_time", "site", "count", "lot_no", "prepare_person"]);
									obj.setPrimaryKey("id");
								},
							}
						]
					},
					{
						type: 'Stretch'
					}
				]
			}
		]
	};

	var todayStr = APP.getToday();
	var todayYearIntVal = todayStr.split('-')[0];
	var todayMonthIntVal = parseInt(todayStr.split('-')[1], 10) - 1;
	var todayDayIntVal = parseInt(todayStr.split('-')[2], 10);

	var startDate = new Date();
	startDate.setYear(todayYearIntVal);
	if (startDate.getDate() != 31) {
		startDate.setMonth(todayMonthIntVal);
		startDate.setDate(todayDayIntVal);
	}
	else {
		startDate.setDate(todayDayIntVal);
		startDate.setMonth(todayMonthIntVal);
	}
	startDate.setDate(startDate.getDate() - 1);
	startDate.setHours(7, 0, 0);

	var ans = GUI.showForm({
		title: self.ttr("Select Export Data"),
		self: self,
		use_core_engine: true,
		items: ui,
		size: "1200x600",
		values: {
			start_time: startDate.Format("yyyy-MM-dd hh:mm:ss"),
			end_time : APP.getToday() + " 07:00:00"

		},
		'buttons': [
			self.ttr('Close') + ':Cancel:Cancel:Normal'
		],
		'include_hidden_items': true
	});


} catch (e) {
	GUI.msgbox({ detail: e });
}


/*---ACTION---
ICON: "export"
LABEL: "Export"
LABEL_ZHCN: "导出"
LABEL_ZHTW: "導出"
ACCEL: ""
TOOLTIP: "Export"
TOOLTIP_ZHCN: "导出"
TOOLTIP_ZHTW: "導出"
PERMISSION: "spumes2-mes-accessories-used-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/