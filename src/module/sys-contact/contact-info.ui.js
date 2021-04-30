[
    {
        name: 'tabwidget',
        type: 'TabWidget',
        property: {},
        pack: {
            stretch: 1
        },
        child: [
            {
                name: 'primary_info_widget',
                type: 'ScrollArea',
                property: {
                    widget_resizable: true,
                    frame_shape: 'NoFrame'
                },
                pack: {
                    label: self.ttr("Primary Information")
                },
                child: {
                    name: 'vlayout',
                    type: 'VBoxLayout',
                    property: { margin: 8, spacing: 8 },
                    child: [
                        {
                            name: 'basic_formlayout',
                            type: 'FormLayout',
                            property: {
                                label_alignment: 'AlignRight',
                                horizontal_spacing: 8, vertical_spacing: 8, margin: 8
                            },
                            pack: {},
                            child: [
                                { //编号
                                    name: 'id',
                                    type: 'LineEdit',
                                    property: {
                                        enabled: false
                                    },
                                    pack: {},
                                    state: function (obj) {
                                        return 'hide';
                                    }
                                },
                                { //姓名
                                    name: 'name',
                                    type: 'LineEdit',
                                    title: self.ttr('Name'),
                                    property: {},
                                    pack: {
                                        label: self.ttr('Name')
                                    },
                                    validate: function (obj, val, title, moment, self) {
                                        if (val.trim() == '') {
                                            return [title + self.ttr(" can not be null"), 'Error'];
                                        }
                                        if (val.trim().length > 255) {
                                            return [title + self.ttr(" length cannot be more than 255"), 'Error'];
                                        }
                                        return;
                                    }
                                },
                                { //性别
                                    name: 'sex',
                                    type: 'ComboBox',
                                    title: self.ttr('Sex'),
                                    property: {
                                        item_list: TOPENM.enumList("sys-sex").toComboList()
                                    },
                                    pack: {
                                        label: self.ttr('Sex')
                                    }
                                },
                                { //状态
                                    name: 'status',
                                    type: 'ComboBox',
                                    title: self.ttr('Status'),
                                    property: {
                                        item_list: TOPENM.enumList("sys-contact-status").toComboList()
                                    },
                                    pack: {
                                        label: self.ttr('Status')
                                    },
                                    validate: function (obj, val, title, moment, self) {
                                        if (val.trim() == '') {
                                            return [title + self.ttr(" can not be null"), 'Error'];
                                        }
                                        return;
                                    },
                                    setter: function (obj, value, self) {
                                        if (_.isEmpty(value)) {
                                            value = "active";
                                        }
                                        obj.setCurrentName(value);
                                    },
                                },
                                { //来源
                                    name: 'source',
                                    type: 'ComboBox',
                                    title: self.ttr('Source'),
                                    property: {
                                        item_list: TOPENM.enumList("sys-contact-source").toComboList()
                                    },
                                    pack: {
                                        label: self.ttr('Source')
                                    },
                                    validate: 'NOTNULL2',
                                    setter: function (obj, value, self) {
                                        if (_.isEmpty(value)) {
                                            value = "company";
                                        }

                                        obj.setCurrentName(value);
                                    },
                                },
                                { //来源编号
                                    name: 'source_serial',
                                    type: 'LineEdit',
                                    title: self.ttr('Source Serial'),
                                    property: {},
                                    pack: {
                                        label: self.ttr('Source Serial')
                                    }
                                },
                                { //工号
                                    name: 'attr_data.staffid',
                                    type: 'LineEdit',
                                    title: self.ttr('Staffid'),
                                    property: {

                                    },
                                    pack: {
                                        label: self.ttr('Staffid')
                                    },
                                    validate: function (obj, val, title, moment, self) {
                                        var sourceStr = this.getValue("source");
                                        if ((val.trim() == '') && _.eq(sourceStr, "company")) {
                                            return [title + self.ttr(" can not be null"), 'Error'];
                                        }
                                        if (moment == "COMMIT") {
                                            var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
                                            var existName = "";
                                            if (_.isEmpty(_.toString(this.getValue("id")))) {
                                                existName = db.selectValue({
                                                    table: "pub_contacts",
                                                    field: "name",
                                                    where: [
                                                        {
                                                            "attr_data->>'staffid'": _.toString(val.trim())
                                                        }
                                                    ]
                                                });
                                            } else {
                                                existName = db.selectValue({
                                                    table: "pub_contacts",
                                                    field: "name",
                                                    where: [
                                                        "id != '" + this.getValue("id") + "'",
                                                        {
                                                            "attr_data->>'staffid'": _.toString(val.trim())
                                                        }
                                                    ]
                                                });
                                            }

                                            if (!_.isEmpty(_.toString(existName))) {
                                                return [_.format(self.ttr("This staffid has been used by {0}, please enter again"), existName), 'Error'];
                                            }
                                        }
                                        return;
                                    }

                                },
                                { //卡号
                                    name: 'attr_data.card_code',
                                    type: 'LineEdit',
                                    title: self.ttr('Card Code'),
                                    property: {

                                    },
                                    pack: {
                                        label: self.ttr('Card Code')
                                    },
                                    validate: function (obj, val, title, moment, self) {
                                        var sourceStr = this.getValue("source");
                                        if ((val.trim() == '') && _.eq(sourceStr, "company")) {
                                            return [title + self.ttr(" can not be null"), 'Error'];
                                        }
                                        if (moment == "COMMIT") {
                                            var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
                                            var existName = "";
                                            if (_.isEmpty(_.toString(this.getValue("id")))) {
                                                existName = db.selectValue({
                                                    table: "pub_contacts",
                                                    field: "name",
                                                    where: [
                                                        "attr_data->>'del_tag' IS NULL OR attr_data->>'del_tag' != '1'",
                                                        {
                                                            "attr_data->>'card_code'": _.toString(val.trim()),
                                                            "status": "active",
                                                            "source": "company"
                                                        }
                                                    ]
                                                });
                                            } else {
                                                existName = db.selectValue({
                                                    table: "pub_contacts",
                                                    field: "name",
                                                    where: [
                                                        "id != '" + this.getValue("id") + "'",
                                                        "attr_data->>'del_tag' IS NULL OR attr_data->>'del_tag' != '1'",
                                                        {
                                                            "attr_data->>'card_code'": _.toString(val.trim()),
                                                            "status": "active",
                                                            "source": "company"
                                                        }
                                                    ]
                                                });
                                            }

                                            if (!_.isEmpty(_.toString(existName))) {
                                                return [_.format(self.ttr("This card code has been used by {0}, please enter again"), existName), 'Error'];
                                            }
                                        }
                                        return;
                                    }

                                },
                                { //公司
                                    name: 'company',
                                    type: 'LineEdit',
                                    title: self.ttr('Company'),
                                    property: {},
                                    pack: {
                                        label: self.ttr('Company')
                                    },
                                    child: [
                                        {
                                            name: 'company_button',
                                            type: 'ToolButton',
                                            property: { icon: 'choose' },
                                            callback: function () {
                                                self.OnCompanyBtnClicked(this.getValue('source'));
                                            }
                                        }
                                    ]
                                },
                                { //部门
                                    name: 'department',
                                    type: 'ComboBox',
                                    title: self.ttr('Department'),
                                    property: {
                                        item_list: TOPENM.enumList("sys-contact-department").toComboList()
                                    },
                                    pack: {
                                        label: self.ttr('Department')
                                    },
                                    // validate: 'NOTNULL2'
                                },
                                {//职位
                                    name: 'title',
                                    type: 'ComboBox',
                                    title: self.ttr('Title'),
                                    property: {
                                        item_list: TOPENM.enumList("sys-contact-title").toComboList()
                                    },
                                    pack: {
                                        label: self.ttr('Title')
                                    }
                                },
                                {//标签
                                    name: 'tags',
                                    type: 'Chips',
                                    title: self.ttr('Tag'),
                                },

                                {//备注
                                    name: 'remark',
                                    type: 'TextEdit',
                                    title: self.ttr('Remark'),
                                    property: {
                                        accept_rich_text: false, max_row_count: 4
                                    },
                                    pack: {
                                        label: self.ttr('Remark')
                                    },
                                    getter: function (obj) {
                                        return obj.plainText;
                                    }
                                }
                            ]
                        },
                        {
                            name: 'title5',
                            type: 'TitleExpander',
                            property:
                            {
                                text: self.ttr('Mail info'),
                                text_style: "font-weight:bold",
                                expanded: true
                            },
                            pack: {},
                            child:
                            {
                                name: 'vboxlayout',
                                type: 'VBoxLayout',
                                property: {
                                    label_alignment: 'AlignTop|AlignRight',
                                    horizontal_spacing: 8, vertical_spacing: 8, margin: 8
                                },
                                pack: {},
                                child: [
                                    {
                                        name: 'other_mail',
                                        type: 'ComboLineCoupleWidget',
                                        property: {},
                                        setter: function (obj, value, self) {
                                            obj.setData(value);
                                        },
                                        getter: function (obj, self) {
                                            return obj.getData();
                                        },
                                        initCallback: function (obj) {
                                            obj.setComboBoxEditable(false);
                                            obj.setEnumName("sys-contact-mail-type");
                                        },
                                        validate: function (obj, val, title, moment, self) {
                                            if (moment == 'COMMIT') {
                                                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                                for (var key in val) {
                                                    var temp = val[key];
                                                    for (var i = 0; i < temp.length; ++i) {
                                                        if (!re.test(temp[i])) {
                                                            return [temp[i] + self.ttr("is not email format"), "Error"];
                                                        }
                                                    }
                                                }
                                            }
                                            return;
                                        },
                                        changeSignal: 'dataChanged()',
                                        validateSignal: 'dataChanged()'
                                    }
                                ]
                            }
                        },
                        {
                            type: 'Stretch'
                        }
                    ]
                }
            },
            {
                name: 'personal_info_widget',
                type: 'ScrollArea',
                property: {
                    widget_resizable: true,
                    frame_shape: 'NoFrame',
                    horizontal_spacing: 8, vertical_spacing: 8, margin: 8
                },
                pack: {
                    label: self.ttr("Personal information")
                },
                child: {
                    name: 'panel_layout1',
                    type: 'VBoxLayout',
                    property: {
                        margin: 10,
                        spacing: 10
                    },
                    child: [
                        {
                            name: 'title1',
                            type: 'TitleExpander',
                            property: {
                                text: self.ttr('Basic Information'),
                                text_style: "font-weight:bold",
                                expanded: true
                            },
                            pack: {},
                            child: {

                                name: 'personal_info_layout',
                                type: 'FormLayout',
                                property: {
                                    label_alignment: 'AlignRight',
                                    horizontal_spacing: 20, vertical_spacing: 10, margin: 20
                                },
                                pack: {},
                                child: [
                                    {
                                        name: 'nick_name',
                                        type: 'LineEdit',
                                        title: self.ttr('Nickname'),
                                        property: {},
                                        pack: {
                                            label: self.ttr('Nickname')
                                        }
                                    },
                                    {
                                        name: 'birth_date',
                                        type: 'DateEdit',
                                        title: self.ttr('BirthDate'),
                                    },
                                    {
                                        name: 'idcard',
                                        type: 'LineEdit',
                                        title: self.ttr('ID Card'),
                                        property: {},
                                        pack: {
                                            label: self.ttr('ID Card')
                                        }
                                    },
                                    {
                                        name: 'category',
                                        type: 'ComboBox',
                                        title: self.ttr('Category'),
                                        property: {
                                            item_list: TOPENM.enumList("sys-contact-category").toComboList()
                                        },
                                        pack: {
                                            label: self.ttr('Category')
                                        }
                                    },
                                    {
                                        name: 'security_level',
                                        type: 'SpinBox',
                                        title: self.ttr('Security Level'),
                                        property: {
                                            decimals: 0,
                                            minimum: 0
                                        },
                                        pack: {
                                            label: self.ttr('Security Level')
                                        }
                                    },
                                    {
                                        name: 'hobby',
                                        type: 'LineEdit',
                                        title: self.ttr('Hobby'),
                                        property: {},
                                        pack: {
                                            label: self.ttr('Hobby')
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            name: 'title2',
                            type: 'TitleExpander',
                            property: {
                                text: self.ttr('IM info'),
                                text_style: "font-weight:bold",
                                expanded: true
                            },
                            pack: {},
                            child:
                            {
                                name: 'other_contact',
                                type: 'ComboLineCoupleWidget',
                                property: {},
                                setter: function (obj, value, self) {
                                    obj.setData(value);
                                },
                                getter: function (obj, self) {
                                    return obj.getData();
                                },
                                initCallback: function (obj) {
                                    obj.setComboBoxEditable(false);
                                    obj.setEnumName("sys-contact-im-type");
                                },
                                changeSignal: 'dataChanged()'
                            }
                        },
                        {
                            name: 'title3',
                            type: 'TitleExpander',
                            property: {
                                text: self.ttr('Phone info'),
                                text_style: "font-weight:bold",
                                expanded: true
                            },
                            pack: {},
                            child:
                            {
                                name: 'phone',
                                type: 'ComboLineCoupleWidget',
                                property: {},
                                setter: function (obj, value, self) {
                                    obj.setData(value);
                                },
                                getter: function (obj, self) {
                                    return obj.getData();
                                },
                                initCallback: function (obj) {
                                    obj.setComboBoxEditable(false);
                                    obj.setEnumName("sys-contact-phone-type");
                                },
                                changeSignal: 'dataChanged()'
                            }
                        },
                        {
                            name: 'title4',
                            type: 'TitleExpander',
                            property: {
                                text: self.ttr('Fax info'),
                                text_style: "font-weight:bold",
                                expanded: true
                            },
                            pack: {},
                            child: {
                                name: 'fax',
                                type: 'ComboLineCoupleWidget',
                                property: {},
                                setter: function (obj, value, self) {
                                    obj.setData(value);
                                },
                                getter: function (obj, self) {
                                    return obj.getData();
                                },
                                initCallback: function (obj) {
                                    obj.setComboBoxEditable(false);
                                    obj.setEnumName("sys-contact-fax-type");
                                },
                                changeSignal: 'dataChanged()'
                            }
                        },
                        {
                            name: 'title6',
                            type: 'TitleExpander',
                            property: {
                                text: self.ttr('Address info'),
                                text_style: "font-weight:bold",
                                expanded: true
                            },
                            pack: {},
                            child: {
                                name: 'address',
                                type: 'ComboLineCoupleWidget',
                                property: {},
                                setter: function (obj, value, self) {
                                    obj.setData(value);
                                },
                                getter: function (obj, self) {
                                    return obj.getData();
                                },
                                initCallback: function (obj) {
                                    obj.setComboBoxEditable(false);
                                    obj.setEnumName("sys-contact-address-type");
                                },
                                changeSignal: 'dataChanged()'
                            }
                        },
                        {
                            type: 'Stretch'
                        }
                    ]
                },
            },
            {
                name: 'related_info_widget',
                type: 'VBoxLayout',
                property: {
                    horizontal_spacing: 8, vertical_spacing: 8, margin: 8
                },
                pack: {
                    label: self.ttr("Related Personnel")
                },
                child: [
                    {
                        name: 'toolbar',
                        type: 'ToolBar',
                        property: {},
                        pack: {},
                        child: [
                            {
                                name: 'act_add_related',
                                type: 'Action',
                                property: {
                                    text: self.ttr('Add Contact'),
                                    icon: 'plus-circle',
                                    shortcut: '',
                                    tooltip: '',
                                    style: 'button_style=both'
                                },
                                callback: function (obj, checked, self) {
                                    self.addRelevantContacts();
                                }
                            },
                            {
                                name: 'act_remove_related',
                                type: 'Action',
                                property: {
                                    text: self.ttr('Remove Contact'),
                                    icon: 'minus-circle',
                                    shortcut: '',
                                    tooltip: '',
                                    style: 'button_style=both'
                                },
                                callback: function (obj, checked, self) {
                                    this.getObject('CONTACT_RELATED_LIST').removeSelectedRows();
                                },
                                state: function (obj, self) {
                                    var selectionData = [];
                                    selectionData = this.getObject("CONTACT_RELATED_LIST").selectedRowDataMaps();
                                    if (selectionData.length > 0) {
                                        return 'enable';
                                    } else {
                                        return 'disable';
                                    }
                                }
                            },
                            {
                                name: 'set_contact_relation',
                                type: 'Action',
                                property: {
                                    text: self.ttr('Set Contact Relation'),
                                    icon: 'user',
                                    shortcut: '',
                                    tooltip: '',
                                    style: 'button_style=both'
                                },
                                callback: function (obj, checked, self) {
                                    self.setContactRelation();
                                },
                                state: function (obj, self) {
                                    var selectionData = [];
                                    selectionData = this.getObject("CONTACT_RELATED_LIST").selectedRowDataMaps();
                                    if (selectionData.length > 0) {
                                        return 'enable';
                                    } else {
                                        return 'disable';
                                    }
                                }
                            },
                            {
                                name: 'move_top',
                                type: 'Action',
                                property: {
                                    text: self.ttr('Move Top'),
                                    icon: 'angle-double-up',
                                    shortcut: '',
                                    tooltip: ''
                                },
                                callback: function (obj, checked, self) {
                                    this.getObject('CONTACT_RELATED_LIST').moveSelectedRowsTop();
                                }
                            },
                            {
                                name: 'move_up',
                                type: 'Action',
                                property: {
                                    text: self.ttr('Move Up'),
                                    icon: 'angle-up',
                                    shortcut: '',
                                    tooltip: ''
                                },
                                callback: function (obj, checked, self) {
                                    this.getObject('CONTACT_RELATED_LIST').moveSelectedRowsUp();
                                }
                            },
                            {
                                name: 'move_down',
                                type: 'Action',
                                property: {
                                    text: self.ttr('Move Down'),
                                    icon: 'angle-down',
                                    shortcut: '',
                                    tooltip: ''
                                },
                                callback: function (obj, checked, self) {
                                    this.getObject('CONTACT_RELATED_LIST').moveSelectedRowsDown();
                                }
                            },
                            {
                                name: 'move_bottom',
                                type: 'Action',
                                property: {
                                    text: self.ttr('Move Bottom'),
                                    icon: 'angle-double-down',
                                    shortcut: '',
                                    tooltip: ''
                                },
                                callback: function (obj, checked, self) {
                                    this.getObject('CONTACT_RELATED_LIST').moveSelectedRowsBottom();
                                }
                            },
                            {
                                name: 'search',
                                type: 'SearchEntry',
                                property: {}
                            }
                        ]
                    },
                    {
                        name: 'CONTACT_RELATED_LIST',
                        type: 'TableView',
                        property: { sort_indicator_shown: false },
                        pack: {},
                        setter: function (obj, value) {
                            if (value == null) {
                                value = [];
                            }
                            obj.loadData(value);
                        },
                        getter: function (obj) {
                            return obj.allDataMap();
                        },
                        initCallback: function (obj) {
                            obj.setHeaderItem(
                                [
                                    {
                                        "displayRole": "$related_id"
                                    },
                                    {
                                        "name": "relation",
                                        "display": self.ttr("Relation"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$relation"
                                    },
                                    {
                                        "name": "name",
                                        "display": self.ttr("Name"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$name"
                                    },
                                    {
                                        "name": "sex",
                                        "display": self.ttr("Sex"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$sex.text",
                                        "decorationRole": "$sex.icon"
                                    },
                                    {
                                        "name": "status",
                                        "display": self.ttr("Status"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$status"
                                    },
                                    {
                                        "name": "source",
                                        "display": self.ttr("Source"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$source"
                                    },
                                    {
                                        "name": "source_serial",
                                        "display": self.ttr("Source Serial"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$source_serial"
                                    },
                                    {
                                        "name": "company",
                                        "display": self.ttr("Company"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$company"
                                    },
                                    {
                                        "name": "department",
                                        "display": self.ttr("Department"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$department"
                                    },
                                    {
                                        "name": "title",
                                        "display": self.ttr("Title"),
                                        "resizeMode": "Interactive",
                                        "size": "80",
                                        "displayRole": "$title"
                                    },
                                    {
                                        "name": "remark",
                                        "display": self.ttr("Remark"),
                                        "resizeMode": "Stretch",
                                        "displayRole": "$remark"
                                    },
                                ]);
                            obj.setDataKeyList(["related_id", "relation", "name", "sex", "sex.text", "sex.icon", "status", "source", "source_serial", "company", "department", "title", "remark"]);
                            obj.setPrimaryKey("related_id");
                        }
                    }
                ]
            }
        ]
    }
]