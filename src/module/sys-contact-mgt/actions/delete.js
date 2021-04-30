try {
    var ans = TMessageBox.question(this, this.ttr("Are you sure to delete selected items?"), '', this.ttr('Delete'),
        [this.ttr("Delete") + ":Yes:Yes", this.ttr("Cancel") + ":Cancel:Cancel"]);
    if (ans != 'Yes') {
        return;
    }
    this.loading(this.ttr("Deleting data..."));
    var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
    db.begin();
    db.updateRow({
        table: "pub_contacts",
        where: {
            "id": this.selectedItems()
        },
        data: {
            "attr_data": {
                "del_tag": 1,
                "card_code": ""
            },
            "action_data": {
                "delete_time": db.getNow(),
                "delete_oper": APP.userName()
            }
        },
        update_policy: {
            "action_data": "json_merge",
            "attr_data": "json_merge"
        }
    })
    if (db.lastError().isValid()) {
        throw db.lastError().text();
    }
    db.commit();
    this.unloading();
    this.refresh(true);
    this.alertOk(this.ttr("Data deleted"));
} catch (e) {
    print(e);
    this.unloading();
    db.rollback();
    this.alertError(this.ttr("Delete data failed!"), _.toString(e));
    // GUI.msgbox({ type: "ERROR", text: _.toString(e) });
}

