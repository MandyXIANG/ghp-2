importPackage("ikm.ole");
importPackage("moment");

var self = this;
try {
    var openFileName = "";
    var fileDlg = new TFileDialog(self.ttr("Open File"));
    fileDlg.setAcceptMode("AcceptOpen");
    fileDlg.setNameFilter("*.xlsx");
    var strLst = fileDlg.run();
    if (strLst.length) {
        openFileName = strLst[0];
    }

    if (_.isEmpty(openFileName)) {
        return;
    }

    var excel = new TExcel();
    var excelBook = excel.openFile(openFileName);
    if (excelBook == undefined || excelBook == null) {
        self.unloading();
        excel.quitExcel();
        delete excel;
        return;
    }

    //获取数据

    var curUsedRows = _.toNumber(excel.getUsedRows());
    var errorId = [];
    for (var curRowCot = 2; curRowCot <= curUsedRows; curRowCot++) {
        var requestDataList = [];
        var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
        db.begin();
        //获取workcenter_id
        var workcenter_code = _.toString(excel.getRangeValue("H" + _.toString(curRowCot)));
        var idValue = db.selectValue({
            table: 'mes_workcenter',
            field: "id",
            where: { code: workcenter_code }
        })
        if (idValue == null) {
            errorId.push(workcenter_code);
            continue;
        }
        if (db.lastError().isValid()) {
            db.rollback();
            throw db.lastError().text();
        }

        requestDataList.push({
            user_code: _.toString(excel.getRangeValue("A" + _.toString(curRowCot))),//工号
            user_name: _.toString(excel.getRangeValue("B" + _.toString(curRowCot))),//姓名
            sex: _.toString(excel.getRangeValue("C" + _.toString(curRowCot))),//性别
            entry_date: _.toString(excel.getRangeValue("D" + _.toString(curRowCot))),//入职日期
            workcenter_id: _.toString(idValue),//工作中心代码
            post_data: _.toString(excel.getRangeValue("G" + _.toString(curRowCot))), //岗位
            start_date: _.toString(excel.getRangeValue("I" + _.toString(curRowCot))),
            end_date: _.toString(excel.getRangeValue("J" + _.toString(curRowCot))),
            auther: _.toString(APP.userName()),
            create_time: String(moment().format('YYYY-MM-DD HH:mm:ss')),
            action_type: "excel_import"

        })
        var requestMap = requestDataList[0];
        //重复验证逻辑 
        /*1. 根据workcenter_id, user_code作为唯一建，查询当前mes_workcenter_certificate表中，是否存在数据；
        若存在：判断当前G列【岗位】值，在当前数据.position_data中是否存在相同的key,
          若存在：则覆盖当前Key，更新value信息；
          若不存在：则组成value,并且marge当前position_data
        若不存在：直接到存储逻辑；*/
        var current_user_code = db.selectValue({
            table: 'mes_workcenter_certificate',
            field: 'id',
            where: {
                user_code: _.toString(requestMap['user_code']),
                workcenter_id: _.toString(requestMap['workcenter_id'])
            }
        })
        if (db.lastError().isValid()) {
            db.rollback();
            throw db.lastError().text();
        }
        var postStr = _.toString(requestMap["post_data"])
        if (_.toString(requestMap["sex"]) == '男') {
            requestMap['sex'] = 'man'
        } else requestMap['sex'] = 'weman'
        var dataMap = {
            workcenter_id: _.toString(requestMap["workcenter_id"]),
            user_code: _.toString(requestMap["user_code"]),
            user_name: _.toString(requestMap["user_name"]),
            user_detail: {
                "sex": _.toString(requestMap["sex"]),
                "entry_date": _.toString(requestMap["entry_date"]).substr(0,10)
            },
            action_data: {
                "auther": _.toString(requestMap["auther"]),
                "create_time": _.toString(requestMap['create_time']),
                "action_type": "excel_import"
            },
            position_data: {},
        }

        var childDataMap = {}
        childDataMap[postStr] = {
            "post": postStr,
            "type": "train",
            "skill": "1",
            "result": "pass",
            "start_date": _.toString(requestMap["start_date"]).substr(0,10),
            "end_date": _.toString(requestMap["end_date"]).substr(0,10),
            "post_desc": postStr,
            "type.text": "培训",
            "skill.text": "初级",
            "result.text": "通过"
        }
        dataMap['position_data'] = childDataMap

        if (current_user_code == null) {
            db.insertRow({
                table: "mes_workcenter_certificate",
                data: dataMap
            })
        } else {
            var postData = db.selectValue({
                table: "mes_workcenter_certificate",
                field: 'position_data',
                where: { id: _.toString(current_user_code) }
            })
            var newlist = [];
            for (var key in postData) {
                newlist.push(key)

            }
            var tmp = 0;
            for (var i = 0; i < newlist.length; i++) {
                if (newlist[i] == _.toString(postStr)) {
                    var kStr = newlist[i]
                    postData[kStr] = childDataMap;
                    // db.updateRow({
                    //     table: "mes_workcenter_certificate",
                    //     data: { position_data: postData },
                    //     where: { id: current_user_code },
                    // })
                }
                else { tmp++; }

                if (tmp == newlist.length) {
                    db.updateRow({
                        table: "mes_workcenter_certificate",
                        data: { position_data: dataMap['position_data'] },
                        where: { id: current_user_code },
                        update_policy: { position_data: 'json_merge' }
                    })
                    break;
                }
                if (i == newlist.length - 1) {
                    db.updateRow({
                        table: "mes_workcenter_certificate",
                        data: { position_data: postData },
                        where: { id: current_user_code },
                    })
                }

            }

            // if(_.toString(key) == postStr){
            //     db.updateRow({
            //         table: "mes_workcenter_certificate",
            //         data: {position_data:dataMap['position_data']},
            //         where:{id:current_user_code},
            //     })
            // }else 
            // db.updateRow({
            //     table: "mes_workcenter_certificate",
            //     data: {position_data:dataMap['position_data']},
            //     where:{id:current_user_code},
            //     update_policy:{position_data:'json_merge'}
            // })

        }
        if (db.lastError().isValid()) {
            db.rollback();
            throw db.lastError().text();
        }

    }
    excel.saveBook();
    excel.closeBook();
    excel.quitExcel();
    delete excel;

    db.commit();
    self.unloading();
    var detailStr = "";
    if (!errorId.length == 0) {
        detailStr = 'workcenter_code数据错误:';
        for (var i = 0; i < errorId.length; i++) {
            detailStr += errorId[i] + ',';
        }
    }
    self.refresh();

    GUI.msgbox({
        type: "INFO",
        text: self.ttr("导入成功"),
        detail: detailStr
    })


} catch (e) {
    self.unloading();
    print(e);
    if (_.isValid(excel)) {
        excel.closeBook();
        excel.quitExcel();
        delete excel;
    }
    GUI.msgbox({
        type: "ERROR",
        detail: e
    })
}

/*---ACTION---
ICON: "import"
LABEL: "Import"
LABEL_ZHCN: "导入"
LABEL_ZHTW: "導入"
TOOLTIP_ZHCN: "从文档导入数据"
TOOLTIP_ZHTW: "從文檔導入數據"
ACCEL: ""
TOOLTIP: "Import data from file"
CHECKED: ""
GROUP: ""
LABEL_EN: ""
LABEL_JP: ""
TOOLTIP_EN: ""
TOOLTIP_JP: ""
PERMISSION: "mes-certificate-create"
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/