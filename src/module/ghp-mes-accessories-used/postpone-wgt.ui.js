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
                        margin: 6
                    },
                    pack: {},
                    child: [
                        {
                            name: 'add_area',
                            type: 'LineEdit',
                            title: self.ttr('Add Area'),
                            property: { readonly: false },
                            pack: { label: self.ttr('Add Area'), "valid_mask": "DOUBLE(2)" },
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
                            name: 'add_time',
                            type: 'LineEdit',
                            title: self.ttr('Add Time'),
                            property: { readonly: false },
                            pack: { label: self.ttr('Add Time'), "valid_mask": "INT()" },
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
                            name: 'adjust_remark',
                            type: 'TextEdit',
                            title: self.ttr('Remark'),
                            property: { vertical_scroll_bar_policy: 'ScrollBarAlwaysOff', accept_rich_text: false },
                            pack: { label: self.ttr('Remark') },
                            getter: function (obj) {
                                return obj.plainText;
                            }
                        },
                        {
                            type: 'stretch'
                        }
                    ]
                }
            }
        ]
    }
]