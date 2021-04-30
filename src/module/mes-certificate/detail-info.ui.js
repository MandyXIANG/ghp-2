[{
    name: 'Splitter',
    type: 'Splitter',
    property: {
        children_collapsible: false,
        orientation: "Vertical",
        stylesheet: "QSplitter::handle{background:#D5D5D5}"
    },
    pack: {},
    child: [{
            name: 'fglayout',
            type: 'FormGridLayout',
            property: {
                columns: 2,
                label_alignment: 'AlignTop | AlignRight',
                margin: 8,
            },
            pack: {},
            child: [{
                    name: 'user_code',
                    type: 'LineEdit',
                    title: 'User Code',
                    property: {readonly : true},
                    pack: {
                        label: self.ttr('User Code'),
                        column_span: 1
                    },
                    validate: 'NOTNULL',
                    child: [{
                        name: 'select_staff',
                        type: 'ToolButton',
                        title: self.ttr("Select"),
                        property: {
                            text: self.ttr('Select'),
                            shortcut: '',
                            tooltip: '',
                            icon: 'choose',
                            style: ' button_style=icon'
                        },
                        callback: function () {
                            // GUI.msgbox({
                            //     detail: "!!!!"
                            // })
                            var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
                            var data = db.selectArrayMap("SELECT name, sex, attr_data->>'staffid' as staffid, remark, attr_data->>'card_code' AS card_code FROM pub_contacts WHERE status='active' AND source = 'company' AND (attr_data->>'del_tag' IS NULL OR attr_data->>'del_tag' != '1')", {
                                "attr_data": "json"
                            })
                            var dialog = new TTableViewDialog(self);
                            dialog.setTitle(self.ttr('Select'))
                            dialog.setButtons([self.ttr("Ok") + ":Ok:Yes:Primary", self.ttr("Cancel") + ":Cancel:Cancel:Normal"])
                            dialog.setPrimaryKey('id')
                            dialog.setDataKeyList(["name", "sex", "sex.text", 'staffid', 'remark', 'card_code'])
                            dialog.setSearchKeys(["name", "staffid", "card_code"])
                            dialog.setHeaderItem([{},
                                {
                                    name: 'name',
                                    display: self.ttr('User Name'),
                                    displayRole: '$name',
                                    size: 100
                                },
                                {
                                    name: 'sex',
                                    display: self.ttr('Sex'),
                                    displayRole: '$sex.text',                                   
                                    size: 100
                                },
                                {
                                    name: 'staffid',
                                    display: self.ttr('User Code'),
                                    displayRole: '$staffid',
                                    size: 100
                                },
                                {
                                    name: 'card_code',
                                    display: self.ttr('Card Code'),
                                    displayRole: '$card_code',
                                    size: 100
                                },
                                {
                                    name: 'remark',
                                    display: self.ttr('Remark'),
                                    displayRole: '$remark',
                                    size: 100
                                },
                            ])
                            var enumList = TOPENM.enumList('sys-sex');
                            _.each(data, function (item, index) {
                                item["sex.text"] = enumList.itemText(item["sex"]);
                            })
                            dialog.loadData(data)
                            var ret = dialog.run();
                            if (_.isEmpty(ret)) return
                            var workcenterEdit = this.getObject('user_code');
                            if (workcenterEdit != null && ret[0] != null) {
                                this.setValue("user_code", _.toString(ret[0]['staffid']));
                                this.setValue("user_name", _.toString(ret[0]['name']));
                                this.setValue("sex", _.toString(ret[0]['sex']));
                                this.setValue("remark", _.toString(ret[0]['remark']));
                            }

                        },
                    }]
                },
                {
                    name: 'user_name',
                    type: 'LineEdit',
                    title: 'User Name',
                    property: {
                        enabled: false
                    },
                    pack: {
                        label: self.ttr('User Name'),
                        column_span: 1,
                        // read_only: true,

                    }
                    // validate: 'NOTNULL'
                },
                {
                    name: 'sex',
                    type: 'ComboBox',
                    title: self.ttr('Sex'),
                    property: {
                        // read_only: true,
                        enabled: false,
                        item_list: TOPENM.enumList('sys-sex').toComboList()
                    },
                    pack: {
                        label: self.ttr('Sex'),
                        column_span: 1
                    }
                    // validate: 'NOTNULL'
                },
                {
                    name : 'entry_date',
                    type : 'DateEdit',
                    title : 'Entry Date',
                    pack : {
                        label : self.ttr('Entry Date'),
                        column_span: 1
                    }
                },
                {
                    name: 'remark',
                    type: 'TextEdit',
                    title: self.ttr('Remark'),
                    property: {
                        vertical_scroll_bar_policy: 'ScrollBarAlwaysOff',
                        accept_rich_text: false
                    },
                    pack: {
                        label: self.ttr('Remark'),
                        column_span: 2
                    },
                    getter: function (obj) {
                        return obj.plainText;
                    },

                },
                {
                    name: 'id',
                    type: 'LineEdit',
                    title: self.ttr('ID'),
                    property: {
                        enabled: false
                    },
                    pack: {
                        label: self.ttr('ID')
                    },
                    state: function () {
                        return 'hide';
                    }
                },
                {
                    type: "stretch"
                },
            ]
        },
        {
            name: 'tabwidget',
            type: 'TabWidget',
            title: self.ttr('Post Infomation'),
            property: {
                maximum_height: 500
            },
            pack: {
                stretch: 1
            },
            child: [{
                    name: 'post_widget',
                    type: 'ScrollArea',
                    property: {
                        widget_resizable: true,
                        frame_shape: 'QFrame::NoFrame'
                    },
                    pack: {
                        label: self.ttr("Post Infomation")
                    },
                    child: {
                        name: 'time_vLayout',
                        type: 'VBoxLayout',
                        property: {
                            margin: 0,
                            spacing: 0
                        },
                        pack: {},
                        child: [{
                                name: 'post_toolbar',
                                type: 'ToolBar',
                                property: {
                                    style: "size=normal"
                                },
                                pack: {},
                                child: [{
                                        name: 'add_post',
                                        type: 'Action',
                                        property: {
                                            text: self.ttr('Add Post'),
                                            shortcut: '',
                                            tooltip: '',
                                            icon: 'addto-circle-o',
                                            style: ' button_style=both'
                                        },
                                        callback: function () {
                                            self.addPost();
                                        },
                                    },
                                    {
                                        name: 'remove_post',
                                        type: 'Action',
                                        property: {
                                            text: self.ttr('Remove Post'),
                                            shortcut: '',
                                            tooltip: '',
                                            icon: 'minus-circle-o',
                                            style: ' button_style=both'
                                        },
                                        callback: function () {
                                            self.removePost();
                                        },
                                    },
                                    {
                                        name: 'log_act',
                                        type: 'Action',
                                        property: {
                                            text: self.ttr('Position Log'),
                                            shortcut: '',
                                            tooltip: '',
                                            icon: 'history',
                                            style: ' button_style=both'
                                        },
                                        callback: function () {
                                            self.showPositionLog();
                                        },
                                    }
                                ]
                            },
                            {
                                name: 'POST_LIST',
                                type: 'TableView',
                                property: {
                                    //size_policy: { 'verticalStretch': 999 },
                                    sort_indicator_shown: false,
                                    header_popup_enabled: true
                                },
                                pack: {},
                                getter: function (obj, self) {
                                    return obj.allDataMap();
                                },
                                initCallback: function (obj) {
                                    obj.setHeaderItem(
                                        [{},
                                            {
                                                "name": "post",
                                                "display": self.ttr("Post"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$post"
                                            },
                                            {
                                                "name": "post_desc",
                                                "display": self.ttr("Post Desc"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$post_desc"
                                            },
                                            {
                                                "name": "type",
                                                "display": self.ttr("Type"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$type.text"
                                            },
                                            {
                                                "name": "start_date",
                                                "display": self.ttr("Start Date"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$start_date"
                                            },
                                            {
                                                "name": "end_date",
                                                "display": self.ttr("End Date"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$end_date"
                                            },
                                            {
                                                "name": "result",
                                                "display": self.ttr("Result"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$result.text"
                                            },
                                            {
                                                "name": "skill",
                                                "display": self.ttr("Level"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$skill.text"
                                            },
                                        ]);
                                    obj.setDataKeyList(["id", "post", "post_desc", "type", "type.text", "start_date", "end_date",
                                        "result", "result.text", "skill", "skill.text", "log", "remark"
                                    ]);
                                    obj.setPrimaryKey("post");
                                },
                                validate: function (obj, val, title, moment, self) {}
                            }

                        ]
                    }
                },
                {
                    name: 'other_widget',
                    type: 'ScrollArea',
                    property: {
                        widget_resizable: true,
                        frame_shape: 'QFrame::NoFrame'
                    },
                    pack: {
                        label: self.ttr("Other Infomation")
                    },
                    child: {
                        name: 'other_vLayout',
                        type: 'VBoxLayout',
                        property: {
                            margin: 0,
                            spacing: 0
                        },
                        pack: {},
                        child: [{
                                name: 'other_toolbar',
                                type: 'ToolBar',
                                property: {
                                    style: "size=normal"
                                },
                                pack: {},
                                child: [{
                                        name: 'add_other',
                                        type: 'Action',
                                        property: {
                                            text: self.ttr('Add Other'),
                                            shortcut: '',
                                            tooltip: '',
                                            icon: 'addto-circle-o',
                                            style: ' button_style=both'
                                        },
                                        callback: function () {
                                            self.addOther();
                                        },
                                    },
                                    {
                                        name: 'remove_other',
                                        type: 'Action',
                                        property: {
                                            text: self.ttr('Remove Other'),
                                            shortcut: '',
                                            tooltip: '',
                                            icon: 'minus-circle-o',
                                            style: ' button_style=both'
                                        },
                                        callback: function () {
                                            self.removeOther();
                                        },
                                    },
                                ]
                            },
                            {
                                name: 'other_view',
                                type: 'TableView',
                                property: {
                                    //size_policy: { 'verticalStretch': 999 },
                                    sort_indicator_shown: false,
                                    header_popup_enabled: true
                                },
                                pack: {},
                                getter: function (obj, self) {
                                    return obj.allDataMap();
                                },
                                initCallback: function (obj) {
                                    obj.setHeaderItem(
                                        [{},
                                            {
                                                "name": "certificate_name",
                                                "display": self.ttr("Certificate Name"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$certificate_name"
                                            },
                                            {
                                                "name": "certificate_code",
                                                "display": self.ttr("Certificate Code"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$certificate_code"
                                            },
                                            {
                                                "name": "career_level",
                                                "display": self.ttr("Career Level"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$career_level"
                                            },
                                            {
                                                "name": "certificate_level",
                                                "display": self.ttr("Certificate Level"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$certificate_level.text"
                                            },
                                            {
                                                "name": "end_date",
                                                "display": self.ttr("Cutoff Date"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$end_date"
                                            },
                                            {
                                                "name": "remark",
                                                "display": self.ttr("Remark"),
                                                "resizeMode": "Interactive",
                                                "size": "100",
                                                "displayRole": "$remark"
                                            }
                                        ]);
                                    obj.setDataKeyList(["certificate_name", "certificate_code", "career_level", "certificate_level", "certificate_level.text", "end_date", "remark"]);
                                    obj.setPrimaryKey("id");
                                },
                                validate: function (obj, val, title, moment, self) {}
                            }

                        ]
                    }
                }
            ]
        },
    ]
}, ]