var self = this

var sqlQuery = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
sqlQuery.begin()
try {
    var selectedIdLst = this.selectedItems();
    if ('ok' != TMessageBox.warning(this, this.ttr('Are you sure to invalidate selected items?'), this.ttr(""), this.ttr('Delete'), [this.ttr('Ok') + ':ok:ok:error', this.ttr('Cancel') + ':cancel:cancel:normal'])) {
        return;
    }

    for (var i = 0; i < selectedIdLst.length; i++) {
        //修改状态为作废invalid    
        var deleter = new TSqlDeleterV2;
        deleter.setTable("mes_workcenter_certificate");
        deleter.setWhere("id",selectedIdLst);
        sqlQuery.deleteRow(deleter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
    }

    sqlQuery.commit();
    self.alertOk(self.ttr("Invalidate data success!"));
    this.refresh();
} catch (e) {
    sqlQuery.rollback()
    print(e);
    this.alertError(this.ttr('Invalidate data failed!'), e);
}

/*---ACTION---
ICON: "close"
LABEL: "Delete"
LABEL_ZHCN: "删除"
LABEL_ZHTW: "刪除"
ACCEL: ""
TOOLTIP: "Delete"
TOOLTIP_ZHCN: "删除"
TOOLTIP_ZHTW: "刪除"
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
STATEHOOK: "if(this.selectedItems().length > 0){return 'enable'}else{return 'disable'}"
---ACTION---*/