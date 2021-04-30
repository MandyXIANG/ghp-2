function func(self) {
    return [
        {
            name: 'scrollarea',
            type: 'ScrollArea',
            property:
            {
                widget_resizable: true, frame_shape: 'NoFrame'
            },
            pack: {},
            child: [
                {
                    name: 'vlayout',
                    type: 'VBoxLayout',
                    property:
                    {
                        margin: 0, spacing: 10
                    },
                    pack: {},
                    child: [
                        {
                            name: 'fglayout',
                            type: 'FormGridLayout',
                            property:
                            {
                                label_alignment: 'AlignRight',
                                margin: 20,
                                vertical_spacing: 10,
                                horizontal_spacing: 20,
                                columns: 2
                            },
                            pack: {},
                            child: [
                                {
                                    name: 'partnumber',
                                    type: 'LineEdit',
                                    title: self.ttr('Partnumber'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Partnumber')
                                    }
                                },
                                {
                                    name: 'partnumber_desc',
                                    type: 'LineEdit',
                                    title: self.ttr('Partnumber Desc'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Partnumber Desc')
                                    }
                                },
                                {
                                    name: 'sys_version',
                                    type: 'LineEdit',
                                    title: self.ttr('Sys Version'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Sys Version')
                                    }
                                },
                                {
                                    name: 'status',
                                    type: 'LineEdit',
                                    title: self.ttr('Status'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Status')
                                    }
                                },
                                {
                                    name: 'attr_data.category',
                                    type: 'LineEdit',
                                    title: self.ttr('SAP Category'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('SAP Category')
                                    }
                                },
                                {
                                    name: 'attr_data.group_name',
                                    type: 'LineEdit',
                                    title: self.ttr('Group Name'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Group Name')
                                    }
                                },
                                {
                                    name: 'attr_data.units',
                                    type: 'LineEdit',
                                    title: self.ttr('Units'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Units')
                                    }
                                },
                                {
                                    name: 'attr_data.create_time',
                                    type: 'LineEdit',
                                    title: self.ttr('Create Time'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Create Time')
                                    }
                                },
                                {
                                    name: 'attr_data.update_time',
                                    type: 'LineEdit',
                                    title: self.ttr('Update Time'),
                                    property: { enabled: false },
                                    pack:
                                    {
                                        label: self.ttr('Update Time')
                                    }
                                },



                            ]
                        },
                        {
                            name: "attr_info_area",
                            type: "TitleExpander",
                            property: {
                                text: self.ttr("Production Attr"),
                                icon: "info",
                                expanded: true
                            },
                            child: [
                                {
                                    name: 'formlayout',
                                    type: 'FormGridLayout',
                                    property: {
                                        // label_alignment: 'AlignTop | AlignRight',
                                        // horizontal_spacing: 10,
                                        // vertical_spacing: 10,
                                        // margin: 10,
                                        columns: 2
                                    },
                                    child: [
                                        {
                                            name: "attr_data.product_line",
                                            title: self.ttr("Product Line"),
                                            type: "ComboBox",
                                            property: {
                                                searchable: true,
                                                max_visible_items: 5,
                                                vertical_scrollbar_policy: 'ScrollBarAsNeeded',
                                                stylesheet: 'QComboBox { combobox-popup: 0; }'
                                            },
                                            initCallback: function (obj, self) {
                                                //"name"+"(code)"的格式，如：钝化二线（GF006）;
                                                var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())
                                                var itemList = query.selectArrayMap({
                                                    table: "mes_workcenter",
                                                    field: ["code AS name", "concat(name, '(',code, ')') AS text"],
                                                    order : "code ASC"
                                                });
                                                if (!_.isValid(itemList)) {
                                                    itemList = [];
                                                }
                                                obj.setItemList(itemList);
                                            }
                                        },
                                        {
                                            name: "attr_data.pn_raw",
                                            title: self.ttr("PN Raw"),
                                            type: "LineEdit"
                                        },
                                        {
                                            name: "attr_data.pn_area",
                                            title: self.ttr("PN Area"),
                                            type: "DoubleLineEdit"
                                        },
                                        {
                                            name: "attr_data.scrap_rate",
                                            title: self.ttr("Scrap Rate"),
                                            type: "DoubleLineEdit"
                                        },
                                        {
                                            name: "attr_data.rack_type",
                                            title: self.ttr("Rack Type"),
                                            type: "LineEdit"
                                        },
                                        {
                                            name: "attr_data.rack_qty",
                                            title: self.ttr("Rack Qty"),
                                            type: "IntLineEdit"
                                        },
                                        {
                                            name: "attr_data.rack_count",
                                            title: self.ttr("Rack Count"),
                                            type: "IntLineEdit"
                                        },
                                        {
                                            type: "Stretch"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: "Stretch"
                        }
                    ]
                }
            ]
        }
    ];
}
