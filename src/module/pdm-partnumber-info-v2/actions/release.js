var self = this;
try {
    var selectedInfo = self.selectedDataMaps()[0];
    if (_.isEmpty(selectedInfo)) return;

    var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());

    var partnumberId = selectedInfo.id;
    var sqlTemp = "select count(1) from mes_partnumber_data_version \
        where partnumber_id = '{0}' and class = '{1}' and status = 'released'"
    // 查询是否存在bom_tree的数据
    var sqlTempBomTree = _.format(sqlTemp, partnumberId, 'bom_tree');
    var bomTreeNum = db.selectValue(sqlTempBomTree, {});
    if (_.toNumber(bomTreeNum) !== 1) {
        GUI.msgbox({
            'type': 'info',
            'title': self.ttr("Tip"),
            'text': self.ttr("Please release first: Product data BOM tree!"),
            'buttons': [
                self.ttr('Ok') + ':Ok:Ok:Primary'
            ]
        });
        return;
    }

    // 查询是否存在traveller的数据
    var sqlTempTraveller = _.format(sqlTemp, partnumberId, 'traveller');
    var travellerNum = db.selectValue(sqlTempTraveller, {});
    if (_.toNumber(travellerNum) !== 1) {
        GUI.msgbox({
            'type': 'info',
            'title': self.ttr("Tip"),
            'text': self.ttr("Please release first: Product process!"),
            'buttons': [
                self.ttr('Ok') + ':Ok:Ok:Primary'
            ]
        });
        return;
    }

    db.begin();
    db.updateRow({
        table: "mes_partnumber",
        data: { status: "released" },
        where: { id: partnumberId }
    });
    if (db.lastError().isValid()) {
        db.rollback();
        throw self.ttr("Release failed") + "!\n" + db.lastError().text();
    }
    
    db.commit();
    self.saveSelection();
    self.refresh();
    self.restoreSelection();

} catch (e) {
    GUI.msgbox({ detail: e })
}

/*---ACTION---
ICON: "check-circle-o"
LABEL: "Released"
LABEL_ZHCN: "放行"
LABEL_ZHTW: "放行"
ACCEL: ""
TOOLTIP: "Version is released"
TOOLTIP_ZHCN: "放行"
TOOLTIP_ZHTW: "放行"
PERMISSION: "pdm-partnumber-attrs-release"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (!_.isEmpty(this.selectedDataMaps()[0]) && _.eq(this.selectedDataMaps()[0]['status'], 'draft')){return 'enable';}else{return 'hide';}"
---ACTION---*/