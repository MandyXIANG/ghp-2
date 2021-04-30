[
    {
        name: 'widgt',
        type: 'Widget',
        property: {},
        pack: { stretch: 1 },
        child: [
            {
                name: 'info',
                type: 'ScrollArea',
                property: { widget_resizable: true, frame_shape: 'QFrame::NoFrame' },
                pack: { label: self.ttr("Information") },
                child: {
                    name: 'formlayout',
                    type: 'FormGridLayout',
                    property: {
                        label_alignment: 'AlignRight',
                        margin: 5
                    },
                    pack: {},
                    child: [
                        {
                            name: 'workcenter_code',
                            type: 'LineEdit',
                            title: self.ttr('Workcenter Code'),
                            property: {
                                readonly: true,
                                enabled: false
                            },
                            pack: { label: self.ttr('Workcenter Code') },
                            validate: function (obj, val, title, moment, self) {
                            },
                            setter: function (obj, value, self) {
                                var workcenterMap = self.workcenterData();
                                obj.setText(workcenterMap["name"]);
                            },
                            child: [
                                {
                                    name: 'select_btn',
                                    type: 'ToolButton',
                                    property: { icon: "choose" },
                                    pack: { position: 'right' },
                                    callback: function (obj, checked, self) {
                                        var rowMap = self.showSelectWorkcenterView();
                                        if (_.isValid(rowMap)) {
                                            var objCode = this.getObject('workcenter_code');
                                            var objName = this.getObject('workcenter_name');
                                            var objId = this.getObject('workcenter_id');

                                            if (_.isValid(objCode)) {
                                                objCode.setText(_.toString(rowMap["name"]));
                                            }

                                            if (_.isValid(objName)) {
                                                objName.setText(_.toString(rowMap["text"]));
                                            }

                                            if (_.isValid(objId)) {
                                                objId.setText(_.toString(rowMap["id"]));
                                            }
                                        }
                                    }
                                },
                            ],
                            validate: 'NotNull'
                        },
                        {
                            name: 'workcenter_name',
                            type: 'LineEdit',
                            title: self.ttr('Workcenter Name'),
                            property: {
                                readonly: true,
                                enabled: false
                            },
                            pack: { label: self.ttr('Workcenter Name') },
                            setter: function (obj, value, self) {
                                var workcenterMap = self.workcenterData();
                                obj.setText(workcenterMap["text"]);
                            },
                            validate: 'NotNull'
                        },
                        {
                            name: 'prepare_time',
                            type: 'DateTimeEdit',
                            title: self.ttr('Input Time'),
                            property: { readonly: false },
                            pack: { label: self.ttr('Input Time') },
                            validate: 'NotNull'
                        },
                        {
                            name: 'card_code',
                            type: 'LineEdit',
                            title: self.ttr('Prepare Card Code'),
                            property: {valid_mask:"REX(^[0-9]*$)"},
                            pack: { label: self.ttr('Prepare Card Code') },
                            validate: function (obj, val, title, moment, self) {
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'Error'];
                                }
                                if (moment == 'EDIT') {
                                    var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
                                    try {
                                        query.begin();
                                        var prepare_name = query.selectValue({
                                            table: "pub_contacts",
                                            field: "name",
                                            where:{
                                                "attr_data->>'card_code' ": val.trim()
                                            }
                                        });
                                        this.getObject("prepare_person").setData('value', prepare_name);
                                    } catch(e) {
                                        print(e)
                                    }
                                }
                            }
                        },
                        {
                            name: 'prepare_person',
                            type: 'LineEdit',
                            title: self.ttr('Prepare Person'),
                            property: { readonly: true },
                            pack: { label: self.ttr('Prepare Person') },
                            validate: 'NotNull'
                        },
                        {
                            name: 'prepare_type',
                            type: 'ComboBox',
                            title: self.ttr('Feeding Type'),
                            property: { item_list: TOPENM.enumList("ghp-mes-feeding-type").toComboList() },
                            pack: { label: self.ttr('Feeding Type') },
                            validate: 'NotNull',
                            setter: function (obj, value, self) {
                                obj.setData("value", "scrap");
                            }
                        },
                        {
                            name: 'slot_position',
                            type: 'LineEdit',
                            title: self.ttr('Slot Position'),
                            property: { readonly: true },
                            pack: { label: self.ttr('Slot Position') },
                            child: [
                                {
                                    name: 'select_btn',
                                    type: 'ToolButton',
                                    property: { icon: "choose" },
                                    pack: { position: 'right' },
                                    callback: function (obj, checked, self) {
                                        var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
                                        try {
                                            var workcenterMap = self.workcenterData();
                                            var selector = new TSqlSelectorV2;
                                            selector.setTable('wms_warehouse_inventory');
                                            selector.setField(["id", "material_code", "location_code", "material_spec->>'type' AS type", "material_code",
                                                "material_name", "bits_units", "attr_data->>'warning_strategy' AS warning_strategy", "lot_no", "current_bits_count",
                                                "attr_data->>'residue_area' AS residue_area", "attr_data->>'residue_time' AS residue_time", "attr_data->>'workcenter_id' AS workcenter_id",
                                                "attr_data->>'area_first_alarm' AS area_first_alarm", "attr_data->>'area_second_alarm' AS area_second_alarm", "attr_data->>'area_first_time' AS area_first_time",
                                                "attr_data->>'area_second_time' AS area_second_time"]);
                                            if (!_.isEmpty(workcenterMap)) {
                                                selector.addWhere("attr_data->>'workcenter_id'", workcenterMap["id"]);
                                            }
                                            selector.addWhere("tags", "{accessories}");
                                            selector.addWhere("current_bits_count > 0");
                                            print("ui-sql:  " + selector.toSql());
                                            var infoList = query.selectArrayMap(selector)
                                            var dialog = new TTableViewDialog(self)
                                            dialog.setData("size", "400,400");
                                            dialog.setTitle(self.ttr('Select'))
                                            dialog.setButtons([self.ttr("Ok") + ":Ok:Ok:Primary", self.ttr("Cancel") + ":Cancel:Cancel:Normal"])
                                            dialog.setPrimaryKey('id')
                                            dialog.setDataKeyList(["id", "material_code", "location_code", "type", "material_name",
                                                "bits_units", "warning_strategy", "lot_no", "current_bits_count", "residue_area", "residue_time", "workcenter_id", "area_second_time", "area_first_alarm",
                                                "area_second_alarm", "area_first_time"])
                                            dialog.setSearchKeys(["material_code", "location_code"])
                                            dialog.setHeaderItem([
                                                {
                                                },
                                                {
                                                    name: 'material_code',
                                                    display: self.ttr('Accessories Code'),
                                                    displayRole: '$material_code',
                                                    size: 150
                                                },
                                                {
                                                    name: 'location_code',
                                                    display: self.ttr('Using position'),
                                                    displayRole: '$location_code',
                                                    size: 150
                                                }
                                            ])
                                            dialog.loadData(infoList)
                                            var ret = dialog.run();
                                            if (_.isEmpty(ret)) return
                                            var slotPosition = this.getObject('slot_position')
                                            if (slotPosition != null && ret[0] != null) {
                                                var map = ret[0];
                                                slotPosition.text = map['location_code'];
                                                this.setValue("partnumber_type", map['type']);
                                                this.setValue("partnumber", map['material_code']);
                                                this.setValue("partnumber_name", map['material_name']);
                                                this.setValue("units", map['bits_units']);
                                                this.setValue("warning_strategy", map['warning_strategy']);
                                                this.setValue("lot_no", map['lot_no']);
                                                this.setValue("count", map['current_bits_count']);
                                                this.setValue("sum_time", map['residue_time']);
                                                this.setValue("sum_area", map['residue_area']);
                                                this.setValue("workcenter_id", map['workcenter_id']);
                                                this.setValue("area_first_alarm", map['area_first_alarm']);
                                                this.setValue("area_first_time", map['area_first_time']);
                                                this.setValue("area_second_alarm", map['area_second_alarm']);
                                                this.setValue("area_second_time", map['area_second_time']);
                                                this.setValue("id", map['id']);

                                                this.getObject("prepare_type").setEnabled(false);
                                                this.getObject("partnumber").setEnabled(false);
                                                this.getObject("count").setEnabled(false);
                                                this.getObject("partnumber_name").setEnabled(false);
                                                this.getObject("units").setEnabled(false);
                                                this.getObject("lot_no").setEnabled(false);
                                                this.getObject("count").setEnabled(false);
                                            }
                                        } catch (e) {
                                            print(e);
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            name: 'partnumber_type',
                            type: 'ComboBox',
                            title: self.ttr('Partnumber Type'),
                            property: { item_list: TOPENM.enumList("ghp-mes-share-accessories-type").toComboList() },
                            pack: { label: self.ttr('Partnumber Type') },
                            validate: 'NotNull'
                        },
                        {
                            name: 'partnumber',
                            type: 'LineEdit',
                            title: self.ttr('Accessories Code'),
                            property: { readonly: true },
                            pack: { label: self.ttr('Accessories Code') },
                            child: [
                                {
                                    name: 'select_btn',
                                    type: 'ToolButton',
                                    property: { icon: "choose" },
                                    pack: { position: 'right' },
                                    callback: function (obj, checked, self) {
                                        var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
                                        try {
                                            var workcenterMap = self.workcenterData();
                                            var selector = new TSqlSelectorV2;
                                            selector.setTable('mes_workcenter_param')
                                            selector.setField(['id', "json_data->>'partnumber' AS partnumber", "json_data->>'partnumber_name' AS partnumber_name", "json_data->>'units' AS units",
                                                "json_data->>'warning_strategy' AS warning_strategy", "json_data->>'sum_area' AS unit_area", "json_data->>'sum_time' AS unit_time",
                                                "json_data->>'area_first_alarm' AS area_first_alarm", "json_data->>'area_second_alarm' AS area_second_alarm",
                                                "json_data->>'area_first_time' AS area_first_time", "json_data->>'area_second_time' AS area_second_time",
                                                "json_data#>>'{used_position}' AS used_position", "workcenter_id"]);
                                            selector.setWhere('param_name', 'accessories');
                                            selector.addWhere("json_data->>'type'", this.getValue('partnumber_type'));
                                            selector.addWhere("status", "released");
                                            if (!_.isEmpty(workcenterMap)) {
                                                selector.addWhere("workcenter_id", workcenterMap["id"]);
                                            }
                                            print("ui-sql:  " + selector.toSql());
                                            var infoList = query.selectArrayMap(selector)
                                            if (query.lastError().isValid()) {
                                                throw query.lastError().text();
                                            }
                                            var dialog = new TTableViewDialog(self)
                                            dialog.setData("size", "500,400");
                                            dialog.setTitle(self.ttr('Select'))
                                            dialog.setButtons([self.ttr("Ok") + ":Ok:Ok:Primary", self.ttr("Cancel") + ":Cancel:Cancel:Normal"])
                                            dialog.setPrimaryKey('id')
                                            dialog.setDataKeyList(["id", "partnumber", "partnumber_name", "units", "warning_strategy", "unit_area", "unit_time", "area_first_alarm", "area_second_alarm",
                                                "area_first_time", "area_second_time", "warning_strategy", "used_position", "workcenter_id"])
                                            dialog.setSearchKeys(["partnumber"])
                                            dialog.setHeaderItem([
                                                {
                                                },
                                                {
                                                    name: 'partnumber',
                                                    display: self.ttr('Accessories Code'),
                                                    displayRole: '$partnumber',
                                                    size: 150
                                                },
                                                {
                                                    name: 'partnumber_name',
                                                    display: self.ttr('Accessories Name'),
                                                    displayRole: '$partnumber_name',
                                                    size: 150
                                                },
                                                {
                                                    name: 'units',
                                                    display: self.ttr('Units'),
                                                    displayRole: '$units',
                                                    size: 150
                                                }
                                            ])
                                            dialog.loadData(infoList)
                                            var ret = dialog.run();
                                            if (_.isEmpty(ret)) return
                                            var code = this.getObject('partnumber')
                                            if (code != null && ret[0] != null) {
                                                var map = ret[0];
                                                code.text = map['partnumber'];
                                                this.setValue("partnumber_name", map['partnumber_name']);
                                                this.setValue("units", map['units']);
                                                this.setValue("unit_time", map['unit_time']);
                                                this.setValue("unit_area", map['unit_area']);
                                                this.setValue("area_first_alarm", map["area_first_alarm"]);
                                                this.setValue("area_second_alarm", map["area_second_alarm"]);
                                                this.setValue("area_first_time", map["area_first_time"]);
                                                this.setValue("area_second_time", map["area_second_time"]);
                                                this.setValue("warning_strategy", map["warning_strategy"]);
                                                this.setValue("workcenter_id", map["workcenter_id"]);
                                                var positions = _.toString(map['used_position']);
                                                var itemList = [];
                                                positions = positions.split(",");
                                                if (positions.length > 0) {
                                                    var sql = "SELECT json_data#>>'{name}' AS name, json_data#>>'{text}' AS text FROM mes_workcenter_param WHERE workcenter_id = {0} AND param_name = 'accessories_used_position' ORDER BY name ASC";
                                                    sql = _.format(sql, self.uid());
                                                    var tmpList = query.selectArrayMap(sql, {});
                                                    if (query.lastError().isValid()) {
                                                        throw query.lastError().text();
                                                    }
                                                    _.forEach(tmpList, function (item) {
                                                        if (_.indexOf(positions, item['name']) != -1) {
                                                            itemList.push(item);
                                                        }
                                                    });
                                                    this.getObject("site").setData("item_list", itemList);
                                                }
                                            }
                                        } catch (e) {
                                            print(e);
                                        }
                                    }
                                }
                            ],
                            validate: 'NotNull'
                        },
                        {
                            name: 'partnumber_name',
                            type: 'LineEdit',
                            title: self.ttr('Partnumber Name'),
                            property: { readonly: true },
                            pack: { label: self.ttr('Partnumber Name') },
                            validate: 'NotNull'
                        },
                        {
                            name: 'units',
                            type: 'LineEdit',
                            title: self.ttr('Units'),
                            property: { readonly: true },
                            pack: { label: self.ttr('Units') },
                        },
                        {
                            name: 'warning_strategy',
                            type: 'ComboBox',
                            property: {
                                item_list: TOPENM.enumList('ghp-mes-share-warning-strategy').toComboList(),
                                readonly: true
                            },
                            pack: { label: self.ttr('Warning Srategy') },
                            validate: 'NOTNULL'
                        },
                        {
                            name: 'site',
                            type: 'ComboBox',
                            title: self.ttr('Using position'),
                            property: {},
                            pack: { label: self.ttr('Using position') },
                            validate: 'NotNull'
                        },
                        {
                            name: 'lot_no',
                            type: 'LineEdit',
                            title: self.ttr('Lot No'),
                            property: { readonly: false },
                            pack: { label: self.ttr('Lot No') },
                        },
                        {
                            name: 'count',
                            type: 'LineEdit',
                            title: self.ttr('Using Count'),
                            property: { readonly: false, valid_mask: 'DOUBLE()' },
                            pack: { label: self.ttr('Using Count') },
                            validate: function (obj, val, title, moment, self) {
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'Error'];
                                }
                                //计算总面积（平方分米）  总时间（分钟）
                                var unitArea = this.getValue("unit_area");
                                var unitTime = this.getValue("unit_time");

                                unitArea = _.toNumber(unitArea);
                                unitTime = _.toNumber(unitTime);

                                var count = _.toNumber(this.getValue('count'));

                                this.setValue('sum_area', unitArea * count);
                                this.setValue('sum_time', unitTime * count);
                            },
                        },
                        {
                            name: 'sum_area',
                            type: 'LineEdit',
                            title: self.ttr('Sum Area'),
                            property: { readonly: false },
                            pack: { label: self.ttr('Sum Area') },
                            child: [
                                {
                                    type: "label",
                                    name: "area_first_alarm_units",
                                    property: {
                                        text: " " + self.ttr('dm²') + " ",
                                        alignment: "HCenter|VCenter",
                                        fixed_width: 36,
                                        fixed_height: 26,
                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                    },
                                    pack: { position: 'right' }
                                }
                            ]
                        },
                        {
                            name: 'sum_time',
                            type: 'LineEdit',
                            title: self.ttr('Sum Time'),
                            property: { readonly: false },
                            pack: { label: self.ttr('Sum Time') },
                            child: [
                                {
                                    type: "label",
                                    name: "sum_time_units",
                                    property: {
                                        text: " " + self.ttr('min') + " ",
                                        alignment: "HCenter|VCenter",
                                        fixed_width: 36,
                                        fixed_height: 26,
                                        stylesheet: "background-color: transparent;border-left: 1px solid lightgray;"
                                    },
                                    pack: { position: 'right' }
                                }
                            ]
                        },
                        {
                            name: 'remark',
                            type: 'TextEdit',
                            title: self.ttr('Remark'),
                            property: { vertical_scroll_bar_policy: 'ScrollBarAlwaysOff', accept_rich_text: false },
                            pack: { label: self.ttr('Remark') },
                            getter: function (obj) {
                                return obj.plainText;
                            }
                        },
                        {
                            name: 'workcenter_id',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            //单位清洗面积
                            name: 'unit_area',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            //单位清洗时间
                            name: 'unit_time',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            name: 'id',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            name: 'area_first_alarm',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            name: 'area_second_alarm',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            name: 'area_first_time',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            name: 'area_second_time',
                            type: 'LineEdit',
                            state: function (obj, self) {
                                return 'hide';
                            }
                        },
                        {
                            type: 'Stretch'
                        }
                    ]
                }
            }
        ]
    }
]