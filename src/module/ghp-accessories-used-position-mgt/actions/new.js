try {
  var self = this;
  self.setDetailUid("");

  var ret = GUI.showForm({
    title: self.ttr("New"),
    ui: this.ui("new_item"),
    self: this,
    use_core_engine: true,
    include_hidden_items: true,
    size: "450x250",
    buttons: [
      self.ttr('New') + ':Ok:Ok:Primary',
      self.ttr('Cancel') + ':Cancel:Cancel:Normal'
    ]
  });

  if (_.isEmpty(ret)) return;

  var data = {};
  _.forEach(ret, function(value, key) {
    _.set(data, key, value);
  });

  var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
  query.begin()
  try {
    var id = query.insertRow({
      table: "mes_workcenter_param",
      data: data,
      unique_field: "id",
      auto_increment_field: "id"
    })
    if (query.lastError().isValid()) throw query.lastError().text()
    query.commit()
  }
  catch (e) {
    query.rollback()
    throw e
  }
  self.refresh();
} catch (e) {
  print(e);
  GUI.msgbox({ title: self.ttr("Error"), text: self.ttr("Create item failed") + "!", detail: e })
}


/*---ACTION---
ICON: "plus"
LABEL: "New"
LABEL_ZHCN: "新建"
LABEL_ZHTW: "新建"
ACCEL: ""
TOOLTIP: "New"
TOOLTIP_ZHCN: "新建"
TOOLTIP_ZHTW: "新建"
PERMISSION: ""
CHECKED: ""
GROUP: ""
STYLE: " button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/