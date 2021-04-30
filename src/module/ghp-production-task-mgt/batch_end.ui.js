function func(self) {
    return [
        {
            name: 'widget',
            type: 'Widget',
            property: {},
            pack: {},
            child: [
                {
                    name: 'scrollarea',
                    type: 'ScrollArea',
                    property:
                    {
                        widget_resizable: true,
                        frame_shape: 'NoFrame'
                    },
                    pack: {},
                    child: [
                        {
                            name: 'vlayout',
                            type: 'VBoxLayout',
                            property: {},
                            pack: {},
                            child: [
                                {
                                    name: 'flayout',
                                    type: 'FormGridLayout',
                                    property: { label_alignment: 'AlignRight', margin: 10, vertical_spacing: 10, horizontal_spacing: 10, columns: 2 },
                                    pack: {},
                                    child: [
                                        {
                                            name: 'partnumber',
                                            type: 'LineEdit',
                                            title: self.ttr('Partnumber'),
                                            property:
                                            {
                                                enabled: false
                                            },
                                            pack: {
                                                label: self.ttr('Partnumber')
                                            },
                                            validate: 'notNull'
                                        },
                                        {
                                            name: 'partnumber_desc',
                                            type: 'LineEdit',
                                            title: self.ttr('Spec Description'),
                                            property:
                                            {
                                                enabled: false
                                            },
                                            pack: {
                                                label: self.ttr('Spec Description')
                                            },
                                        },
                                        {
                                            name: 'stage1_dmc',
                                            type: 'LineEdit',
                                            title: self.ttr('Stage1 Dmc'),
                                            property: {
                                                enabled: false
                                            },
                                            pack: {
                                                label: self.ttr('Stage1 Dmc')
                                            },
                                            validate: 'notNull'
                                        },
                                        {
                                            name: 'end_time',
                                            type: 'DateTimeEdit',
                                            title: self.ttr('Commit Time'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Commit Time')
                                            },
                                            validate: 'notNull'
                                        },
                                        {
                                            name: '',
                                            type: 'Widget'
                                        },
                                        {
                                            name: 'space',
                                            type: 'Widget',
                                            property: {
                                                styleSheet: "{ background-color:red;}", fixed_height: 20
                                            },
                                            pack: {
                                                column_span: 2,
                                            },
                                        },
                                        {
                                            name: 'input_qty',
                                            type: 'LineEdit',
                                            title: self.ttr('Inbound Qty'),
                                            property: {
                                                enabled: false
                                            },
                                            pack: {
                                                label: self.ttr('Inbound Qty')
                                            },
                                            validate: function (obj, val, title, moment) {
                                                if (val.trim() == '') {
                                                    return [title + self.ttr(" can not be null!"), 'error'];
                                                }
                                                var inputQty = _.toNumber(val);
                                                var diffQty = _.toNumber(this.getObject("diff_qty").getData());
                                                var goodQty = _.toNumber(this.getObject("good_qty").getData());
                                                var scrapQty = _.toNumber(this.getObject("scrap_qty").getData());
                                                if ((inputQty + diffQty) != (goodQty + scrapQty)) {
                                                    return [self.ttr("Quantity input does not meet the requirements: unqualified quantity + work report quantity = profit and loss quantity + inbound quantity"), 'error'];
                                                }
                                            }
                                        },
                                        {
                                            name: 'good_qty',
                                            type: 'LineEdit',
                                            title: self.ttr('Commit Count'),
                                            property: {
                                                enabled: true
                                            },
                                            pack: {
                                                label: self.ttr('Commit Count')
                                            },
                                            validate: 'notNull'
                                        },
                                        {
                                            name: 'scrap_qty',
                                            type: 'LineEdit',
                                            title: self.ttr('Unqualified Qty'),
                                            property: {
                                                enabled: true
                                            },
                                            pack: {
                                                label: self.ttr('Unqualified Qty')
                                            },
                                            validate: 'notNull'
                                        },
                                        {
                                            name: 'diff_qty',
                                            type: 'LineEdit',
                                            title: self.ttr('Diff Qty'),
                                            property:
                                            {},
                                            pack: {
                                                label: self.ttr('Diff Qty')
                                            },
                                            validate: 'notNull'
                                        },
                                        {
                                            name: 'ishighlight',
                                            type: 'CheckBox',
                                            title: self.ttr('Ishighlight'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Ishighlight')
                                            }
                                        },
                                        {
                                            name: 'islotend',
                                            type: 'CheckBox',
                                            title: self.ttr('Islotend'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Islotend')
                                            },
                                            state: function (obj, self) {
                                                if (!self.isFirstProcess()) {
                                                    return 'Disable';
                                                } else {
                                                    return 'enable'
                                                }
                                            }
                                        },
                                        {
                                            name: 'stretcher',
                                            type: 'Widget',
                                            property: { size_policy: 'Qt::Expanding' }
                                        }
                                    ]
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
    ];
}