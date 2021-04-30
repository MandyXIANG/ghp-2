function func(self) {
    return [
        {
            name: 'vlayout',
            type: 'VBoxLayout',
            property: {
                margin: 0, spacing: 10
            },
            child: [
                {
                    name: 'forgridlayout1',
                    type: 'FormGridLayout',
                    property: {
                        label_alignment: 'AlignRight', margin: 10, vertical_spacing: 10, horizontal_spacing: 20
                    },
                    child: [
                        {
                            name: "card_code",
                            type: "LineEdit",
                            title: self.ttr("Card Code"),
                            property: { enabled: true },
                            pack: { label: self.ttr("Card Code") },
                            child: [
                                {
                                    name: 'cancel_btn',
                                    type: 'ToolButton',
                                    property: {
                                        icon: "window-close-t",
                                        icon_size: 10
                                    },
                                    pack: { position: 'right' },
                                    callback: function (obj, checked, self) {
                                        self.beginWorkCancel();
                                    }
                                }
                            ],
                        }
                    ]
                },
                {
                    name: "employee_info",
                    type: "TitleExpander",
                    property: { text: self.ttr("Employ Info"), expanded: true },
                    pack: { layout_type: 2 },
                    child: {
                        name: 'forgridlayout2',
                        type: 'FormGridLayout',
                        property: {
                            label_alignment: 'AlignRight',
                            margin: 10, vertical_spacing: 10,
                            horizontal_spacing: 10,
                            columns: 2,
                        },
                        child: [
                            {
                                name: "staffid",
                                type: "LineEdit",
                                title: self.ttr("Staffid"),
                                pack: { label: self.ttr("Staffid") },
                                state: function (obj, self) {
                                    return 'Disable';
                                }
                            },
                            {
                                name: "fullname",
                                type: "LineEdit",
                                title: self.ttr("Fullname"),
                                pack: { label: self.ttr("Fullname") },
                                state: function (obj, self) {
                                    return 'Disable';
                                }
                            }
                        ]
                    }
                },
                {
                    name: "preset_position",
                    type: "TitleExpander",
                    property: {
                        text: self.ttr("Preset postition"),
                        expanded: true,
                    },
                    pack: { layout_type: 2 },
                    child: {
                        name: 'forgridlayout3',
                        type: 'FormGridLayout',
                        property: {
                            label_alignment: 'AlignRight',
                            margin: 10, vertical_spacing: 10,
                            horizontal_spacing: 10
                        },
                        child: [
                            {
                                name: 'no_post_preset',
                                type: 'Label',
                                property: {
                                    value: self.ttr('Nothing')
                                }
                            },
                            {
                                name: 'post_preset',
                                type: 'MultiCheckBox',
                                property: {
                                    item_list: TOPENM.enumList("").toComboList(),
                                    name_format: 'A,B',
                                    column_count: 3
                                },
                                setter: function(obj,value,self) {
                                    if (!_.isEmpty(self.getPostPresetData())) {
                                        this.setState("post_preset", "Show");
                                        this.setState("no_post_preset", "Hide");
                                        obj.setData('value', value);
                                    } else {
                                        this.setState("no_post_preset", "Show");
                                        this.setState("post_preset", "Hide");
                                    }
                                },
                                initCallback:function(obj,self) {
                                    this.setState("post_preset", "Hide");
                                }
                            }
                        ]
                    }
                },
                {
                    name: "operational_post",
                    type: "TitleExpander",
                    property: { text: self.ttr("Operational post"), expanded: true },
                    pack: { layout_type: 2 },
                    child: {
                        name: 'forgridlayout4',
                        type: 'FormGridLayout',
                        property: {
                            label_alignment: 'AlignRight',
                            margin: 10, vertical_spacing: 10,
                            horizontal_spacing: 10
                        },
                        child: [
                            {
                                name: 'no_post_operational',
                                type: 'Label',
                                property: {
                                    value: self.ttr('Nothing')
                                }
                            },
                            {
                                name: 'post_operational',
                                type: 'MultiCheckBox',
                                property: {
                                    item_list: TOPENM.enumList("").toComboList(),
                                    name_format: 'A,B',
                                    column_count: 3
                                },
                                setter: function(obj,value,self) {
                                    if (!_.isEmpty(self.getOperationalPostData())) {
                                        this.setState("post_operational", "Show");
                                        this.setState("no_post_operational", "Hide");
                                        obj.setData('value', value);
                                    } else {
                                        this.setState("no_post_operational", "Show");
                                        this.setState("post_operational", "Hide");
                                    }
                                },
                                initCallback:function(obj,self) {
                                    this.setState("post_operational", "Hide");
                                }
                            }
                        ]
                    }
                },
                {
                    type: 'HBoxLayout',
                    property: {
                        margin: 10, 
                        vertical_spacing: 10,
                        horizontal_spacing: 10
                    },
                    pack: {
                        alignment: 'Left'
                    },
                    child: [
                        {
                            name: 'post_aythorizarion',
                            type: 'PushButton',
                            property: {
                                text: self.ttr('Post authorization'),
                                icon: "vcard-o",
                                enabled: false
                            }
                        },
                        {
                            type: 'Stretch'
                        }
                    ]
                },
                {
                    name: "aythorizarion_post",
                    type: "TitleExpander",
                    property: { text: self.ttr("Authorized post"), expanded: true },
                    pack: { layout_type: 2 },
                    child: {
                        name: 'forgridlayout4',
                        type: 'FormGridLayout',
                        property: {
                            label_alignment: 'AlignRight',
                            margin: 10, vertical_spacing: 10,
                            horizontal_spacing: 10
                        },
                        child: [
                            {
                                name: 'no_authorized_post',
                                type: 'Label',
                                property: {
                                    value: self.ttr('Nothing')
                                }
                            },
                            {
                                name: 'authorized_post',
                                type: 'MultiCheckBox',
                                property: {
                                    item_list: TOPENM.enumList("").toComboList(),
                                    name_format: 'A,B',
                                    column_count: 3,
                                    enabled: false
                                },
                                setter: function(obj,value,self) {
                                    if (!_.isEmpty(self.getAuthorizedPostData())) {
                                        this.setState("authorized_post", "Show");
                                        this.setState("no_authorized_post", "Hide");
                                        this.getObject("post_aythorizarion").setData("enabled", true);
                                        obj.setData('value', value);
                                    } else {
                                        this.setState("no_authorized_post", "Show");
                                        this.setState("authorized_post", "Hide");
                                        this.getObject("post_aythorizarion").setData("enabled", false);
                                    }
                                },
                                initCallback:function(obj,self) {
                                    this.setState("authorized_post", "Hide");
                                }
                            }
                        ]
                    }
                }
            ]
        }
    ];
}
