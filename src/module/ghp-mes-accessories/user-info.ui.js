function func(self) {
    return [
        {
            name: 'basic_config_area',
            type: 'ScrollArea',
            property: { widget_resizable: true, frame_shape: 'NoFrame' },
            pack: { label: self.ttr('Basic Configure') },
            child: [
                {
                    name: 'vstretch',
                    type: 'VBoxLayout',
                    property: { margin: 10, spacing: 5 },
                    child: [
                        {
                            name: 'detai_view',
                            type: 'widget',
                            property: {
                                margin: 0
                            },
                            child: [
                                {
                                    name: 'basic_config_layout',
                                    type: 'FormGridLayout',
                                    property: {
                                        label_alignment: 'AlignRight',
                                        margin: 0,
                                        spacing: 10,
                                        columns: 1
                                    },
                                    child: [
                                        {
                                            name: 'code',
                                            type: 'LineEdit',
                                            property: { readonly: true },
                                            pack: {
                                                stretch: 10, label: self.ttr('Workcenter Code'),
                                                column_span: 1
                                            },
                                            validate: 'NOTNULL',
                                            child: [
                                                {
                                                    // 按钮1
                                                    type: 'ToolButton',
                                                    property: { shortcut: '', tooltip: '', icon: 'choose', style: 'button_style=icon' },
                                                    pack: { position: 'right' }, // 按钮在LineEdit中的位置
                                                    callback: function (obj, checked, self) {
                                                        var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
                                                        try {
                                                            var selector = new TSqlSelectorV2;
                                                            selector.setTable('mes_workcenter')
                                                            selector.setField(['id', 'code', 'name'])
                                                            if (_.isEmpty(self.getMainUid())) {
                                                                selector.addWhere("(attr_data#>>'{del_flag}')::INTEGER<>1 OR (attr_data#>>'{del_flag}') IS NULL");
                                                            } else {
                                                                selector.addWhere("id", self.getMainUid());
                                                            }

                                                            selector.setOrder("code ASC");
                                                            print("ui-sql:  " + selector.toSql());
                                                            var workcenterList = query.selectArrayMap(selector)
                                                            var dialog = new TTableViewDialog(self)
                                                            dialog.width = 400
                                                            dialog.height = 400
                                                            dialog.setTitle(self.ttr('Select'))
                                                            dialog.setButtons([self.ttr("Ok") + ":Ok:Yes:Primary", self.ttr("Cancel") + ":Cancel:Cancel:Normal"])
                                                            dialog.setPrimaryKey('id')
                                                            dialog.setDataKeyList(["id", "code", 'name'])
                                                            dialog.setSearchKeys(["code"])
                                                            dialog.setHeaderItem([
                                                                {
                                                                },
                                                                {
                                                                    name: 'code',
                                                                    display: self.ttr('Workcenter Code'),
                                                                    displayRole: '$code',
                                                                    size: 150
                                                                },
                                                                {
                                                                    name: 'name',
                                                                    display: self.ttr('Workcenter Name'),
                                                                    displayRole: '$name',
                                                                    size: 150
                                                                }
                                                            ])
                                                            dialog.loadData(workcenterList)
                                                            var ret = dialog.run();
                                                            if (_.isEmpty(ret)) return
                                                            var workcenterEdit = this.getObject('code')
                                                            if (workcenterEdit != null && ret[0] != null) {
                                                                workcenterEdit.text = ret[0]['code'];
                                                                this.setValue("name", ret[0]['name']);
                                                                this.setValue("workcenter_id", ret[0]['id']);
                                                            }
                                                        } catch (e) {
                                                            print(e);
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            name: 'name',
                                            type: 'LineEdit',
                                            property: { readonly: true },
                                            pack: { label: self.ttr('Workcenter Name') },
                                            validate: 'NOTNULL'
                                        },
                                        {
                                            name: 'workcenter_id',
                                            type: 'LineEdit',
                                            property: { enabled: false },
                                            pack: { label: self.ttr('Workcenter ID') },
                                            state: function () {
                                                return 'hide';
                                            },
                                            // validate: 'NOTNULL'
                                            setter: function (obj, value, self) {
                                                try {
                                                    var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
                                                    var sql = "SELECT json_data#>>'{name}' AS name, json_data#>>'{text}' AS text FROM mes_workcenter_param WHERE workcenter_id = {0} AND param_name = 'accessories_used_position' ORDER BY name ASC";
                                                    sql = _.format(sql, value);
                                                    var itemList = query.selectArrayMap(sql, {});
                                                    if (query.lastError().isValid()) {
                                                        throw query.lastError().text();
                                                    }
                                                    this.getObject("json_data.used_position").setData("item_list", itemList);
                                                    if (_.toNumber(self.uid()) != 0) {
                                                        var position = self.getMapData("json_data.used_position");
                                                        this.getObject("json_data.used_position").setData("value", position);
                                                    }
                                                } catch (e) {
                                                    print(e);
                                                }
                                                obj.setData("value", value);
                                            }
                                        },
                                        {
                                            name: 'json_data.used_position',
                                            type: 'MultiComboBox',
                                            property: {},
                                            pack: { label: self.ttr('Used Position') }
                                        },
                                        {
                                            name: 'json_data.type',
                                            type: 'ComboBox',
                                            property: {
                                                item_list: TOPENM.enumList('ghp-mes-share-accessories-type').toComboList()
                                            },
                                            pack: { label: self.ttr('Accessories Type') },
                                            validate: 'NOTNULL'
                                        },
                                        {
                                            name: 'json_data.partnumber',
                                            type: 'LineEdit',
                                            pack: { label: self.ttr('Accessories Code') },
                                            property: {readonly: true},
                                            validate: 'NOTNULL',
                                            child: [
                                                {
                                                    // 按钮1
                                                    type: 'ToolButton',
                                                    property: { shortcut: '', tooltip: '', icon: 'choose', style: 'button_style=icon' },
                                                    pack: { position: 'right' },
                                                    callback: function (obj, checked, self) {
                                                        var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
                                                        try {
                                                            var selector = new TSqlSelectorV2;
                                                            selector.setTable('mes_material')
                                                            selector.setField(['partnumber', 'partnumber_desc', 'basic_unit'])
                                                            selector.setWhere("mat_type = 'raw_material'");
                                                            selector.setOrder("partnumber ASC");
                                                            var materialList = query.selectArrayMap(selector)
                                                            var dialog = new TTableViewDialog(self);
                                                            dialog.setData('size', [600, 500]);
                                                            dialog.setTitle(self.ttr('Select'))
                                                            dialog.setButtons([self.ttr("Ok") + ":Ok:Yes:Primary", self.ttr("Cancel") + ":Cancel:Cancel:Normal"])
                                                            dialog.setPrimaryKey('partnumber');
                                                            dialog.setDataKeyList(["partnumber", "partnumber_desc", 'basic_unit']);
                                                            dialog.setSearchKeys(["partnumber"]);
                                                            dialog.setHeaderItem([
                                                                {
                                                                },
                                                                {
                                                                    name: 'partnumber',
                                                                    display: self.ttr('Partnumber'),
                                                                    displayRole: '$partnumber',
                                                                    size: 180
                                                                },
                                                                {
                                                                    name: 'partnumber_desc',
                                                                    display: self.ttr('Partnumber Desc'),
                                                                    displayRole: '$partnumber_desc',
                                                                    size: 310
                                                                },
                                                                {
                                                                    name: 'basic_unit',
                                                                    display: self.ttr('Units'),
                                                                    displayRole: '$basic_unit',
                                                                    size: 100
                                                                }
                                                            ])
                                                            dialog.loadData(materialList)
                                                            var ret = dialog.run();
                                                            if (_.isEmpty(ret)) return;
                                                            this.getObject("json_data.partnumber").setData('value', ret[0]["partnumber"]);
                                                            this.getObject("json_data.partnumber_name").setData('value', ret[0]["partnumber_desc"]);
                                                            this.getObject("json_data.units").setData('value', ret[0]["basic_unit"]);
                                                        } catch (e) {
                                                            print(e);
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            name: 'json_data.partnumber_name',
                                            type: 'LineEdit',
                                            property: {readonly: true},
                                            pack: { label: self.ttr('Accessories Name') }
                                        },
                                        {
                                            name: 'json_data.units',
                                            type: 'LineEdit',
                                            property: {readonly: true},
                                            pack: { label: self.ttr('Units') }
                                        },
                                        {
                                            name: 'json_data.sum_area',
                                            type: 'LineEdit',
                                            property: { valid_mask: "DOUBLE(4)" },
                                            pack: { label: self.ttr('Sum Area') },
                                            child: [
                                                {
                                                    type: "label",
                                                    name: "sum_area_units",
                                                    property: {
                                                        text: " " + self.ttr('dm²') + " ",
                                                        alignment: "HCenter|VCenter",
                                                        fixed_height: 26,
                                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                                    },
                                                    pack: { position: 'right' }
                                                }
                                            ],
                                            validate: function (obj, val, title, moment, self) {
                                                if (_.isEmpty(val)) {
                                                    return [title + self.ttr(" can not be null!"), "ERROR"];
                                                }
                                                if (!_.isNumber(_.toNumber(val)) || _.toNumber(val) < 0) {
                                                    return [title + self.ttr(" Can not be a special character or a number less than 0!"), "ERROR"]
                                                }
                                            }
                                        },
                                        {
                                            name: 'json_data.area_first_alarm',
                                            type: 'LineEdit',
                                            property: { valid_mask: "DOUBLE(4)" },
                                            pack: { label: self.ttr('First Alarm') },
                                            child: [
                                                {
                                                    type: "label",
                                                    name: "area_first_alarm_units",
                                                    property: {
                                                        text: " " + self.ttr('dm²') + " ",
                                                        alignment: "HCenter|VCenter",
                                                        fixed_height: 26,
                                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                                    },
                                                    pack: { position: 'right' }
                                                }
                                            ],
                                            validate: function (obj, val, title, moment, self) {
                                                if (_.isEmpty(val)) {
                                                    return [title + self.ttr(" can not be null!"), "ERROR"];
                                                }
                                                if (!_.isNumber(_.toNumber(val)) || _.toNumber(val) < 0) {
                                                    return [title + self.ttr(" Can not be a special character or a number less than 0!"), "ERROR"]
                                                }
                                            }
                                        },
                                        {
                                            name: 'json_data.area_second_alarm',
                                            type: 'LineEdit',
                                            property: { valid_mask: "DOUBLE(4)" },
                                            pack: { label: self.ttr('Second Alarm') },
                                            child: [
                                                {
                                                    type: "label",
                                                    name: "area_second_alarm_units",
                                                    property: {
                                                        text: " " + self.ttr('dm²') + " ",
                                                        alignment: "HCenter|VCenter",
                                                        fixed_height: 26,
                                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                                    },
                                                    pack: { position: 'right' }
                                                }
                                            ],
                                            validate: function (obj, val, title, moment, self) {
                                                if (_.isEmpty(val)) {
                                                    return [title + self.ttr(" can not be null!"), "ERROR"];
                                                }
                                                if (!_.isNumber(_.toNumber(val)) || _.toNumber(val) < 0) {
                                                    return [title + self.ttr(" Can not be a special character or a number less than 0!"), "ERROR"]
                                                }
                                            }
                                        },
                                        {
                                            name: 'json_data.sum_time',
                                            type: 'LineEdit',
                                            property: { valid_mask: "DOUBLE(4)" },
                                            pack: { label: self.ttr('Sum Time') },
                                            child: [
                                                {
                                                    type: "label",
                                                    name: "sum_time_units",
                                                    property: {
                                                        text: " " + self.ttr('min') + " ",
                                                        alignment: "HCenter|VCenter",
                                                        fixed_height: 26,
                                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                                    },
                                                    pack: { position: 'right' }
                                                }
                                            ],
                                            validate: function (obj, val, title, moment, self) {
                                                if (_.isEmpty(val)) {
                                                    return [title + self.ttr(" can not be null!"), "ERROR"];
                                                }
                                                if (!_.isNumber(_.toNumber(val)) || _.toNumber(val) < 0) {
                                                    return [title + self.ttr(" Can not be a special character or a number less than 0!"), "ERROR"]
                                                }
                                            }
                                        },
                                        {
                                            name: 'json_data.time_first_alarm',
                                            type: 'LineEdit',
                                            property: { valid_mask: "DOUBLE(4)" },
                                            pack: { label: self.ttr('First Alarm') },
                                            child: [
                                                {
                                                    type: "label",
                                                    name: "time_first_alarm_units",
                                                    property: {
                                                        text: " " + self.ttr('min') + " ",
                                                        alignment: "HCenter|VCenter",
                                                        fixed_height: 26,
                                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                                    },
                                                    pack: { position: 'right' }
                                                }
                                            ],
                                            validate: function (obj, val, title, moment, self) {
                                                if (_.isEmpty(val)) {
                                                    return [title + self.ttr(" can not be null!"), "ERROR"];
                                                }
                                                if (!_.isNumber(_.toNumber(val)) || _.toNumber(val) < 0) {
                                                    return [title + self.ttr(" Can not be a special character or a number less than 0!"), "ERROR"]
                                                }
                                            }
                                        },
                                        {
                                            name: 'json_data.time_second_alarm',
                                            type: 'LineEdit',
                                            property: { valid_mask: "DOUBLE(4)" },
                                            pack: { label: self.ttr('Second Alarm') },
                                            child: [
                                                {
                                                    type: "label",
                                                    name: "time_second_alarm_units",
                                                    property: {
                                                        text: " " + self.ttr('min') + " ",
                                                        alignment: "HCenter|VCenter",
                                                        fixed_height: 26,
                                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                                    },
                                                    pack: { position: 'right' }
                                                }
                                            ],
                                            validate: function (obj, val, title, moment, self) {
                                                if (_.isEmpty(val)) {
                                                    return [title + self.ttr(" can not be null!"), "ERROR"];
                                                }
                                                if (!_.isNumber(_.toNumber(val)) || _.toNumber(val) < 0) {
                                                    return [title + self.ttr(" Can not be a special character or a number less than 0!"), "ERROR"]
                                                }
                                            }
                                        },
                                        {
                                            name: 'json_data.warning_strategy',
                                            type: 'ComboBox',
                                            property: {
                                                item_list: TOPENM.enumList('ghp-mes-share-warning-strategy').toComboList()
                                            },
                                            pack: { label: self.ttr('Warning Srategy') },
                                            validate: 'NOTNULL',
                                            value: 'come_first'
                                        },
                                        {
                                            name: 'status',
                                            type: 'ComboBox',
                                            property: {
                                                enabled: false
                                            },
                                            pack: { label: self.ttr('Status') },
                                            initCallback: function (obj) {
                                                var existNames = ["draft", "released"];
                                                var newItemLst = [];
                                                var itemLst = TOPENM.enumList('ghp-parts-status').toComboList();
                                                for (var i = 0; i < itemLst.length; i++) {
                                                    if (!_.fuzzyEqual(existNames.indexOf(_.toString(itemLst[i]["name"])), -1)) {
                                                        newItemLst.push(itemLst[i]);
                                                    }
                                                }
                                                obj.setItemList(newItemLst);
                                            },
                                            validate: 'NOTNULL',
                                            value: 'draft'
                                        },
                                        {
                                            name: 'remark',
                                            type: 'TextEdit',
                                            property: {
                                                vertical_scroll_bar_policy: 'ScrollBarAlwaysOff',
                                                accept_rich_text: false,
                                                min_row_count: 2,
                                                max_row_count: 4
                                            },
                                            pack: {
                                                label: self.ttr('Remark')
                                            }
                                        },
                                        {
                                            name: 'id',
                                            type: 'LineEdit',
                                            property: { enabeld: false },
                                            pack: { label: self.ttr('ID') },
                                            state: function () {
                                                return 'hide';
                                            },
                                            // validate: 'NOTNULL'
                                        },
                                        {
                                            type: 'Stretch'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
