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
                        label_alignment: 'AlignRight',
                        margin: 10,
                        vertical_spacing: 10,
                        horizontal_spacing: 10,
                        columns: 2
                    },
                    child: [
                        {
                            name: "stage2_dmc",
                            type: "LineEdit",
                            title: self.ttr("Short Lot No"),
                            property: {
                                enabled: true
                            },
                            pack: {
                                label: self.ttr("Short Lot No"),
                                column_span: 2
                            },
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
                                        this.getObject("stage2_dmc").setData("value", "");
                                    }
                                }
                            ],
                        },
                        {
                            name: '',
                            type: 'Widget',
                            pack: {
                                column_span: 2
                            },
                        },
                        {
                            name: "card_code",
                            type: "LineEdit",
                            title: self.ttr("Scanning Area"),
                            property: {
                                enabled: true
                            },
                            pack: {
                                label: self.ttr("Scanning Area"),
                                column_span: 2
                            },
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
                                        var stage2Dmc = this.getObject("stage2_dmc").getData("value");
                                        var quicklyFinish = this.getObject("quickly_finish").getData("value");
                                        this.clearValues();
                                        this.getObject("stage2_dmc").setData("value", stage2Dmc);
                                        this.getObject("quickly_finish").setData("value", quicklyFinish);
                                    }
                                }
                            ],
                        },
                        {
                            name: '',
                            type: 'Widget',
                            pack: {
                                column_span: 2
                            },
                        },
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
                            }
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
                            }
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
                            name: 'rack_qty',
                            type: 'LineEdit',
                            title: self.ttr('Rack Qty'),
                            property: {},
                            pack: {
                                label: self.ttr('Rack Qty')
                            },
                            initCallback: function (obj, self) {
                                obj['returnPressed()'].connect(this, function () {
                                    var rackCount = _.toNumber(this.getObject("rack_count").getData("value"));
                                    var inputQty = _.toNumber(obj.getData("value")) * rackCount;
                                    this.getObject("input_qty").setData("value", inputQty);
                                });
                            },
                            validate: function (obj, val, title, moment) {
                                if (_.toNumber(val) <= 0) {
                                    return [title + self.ttr(" must be > 0!"), 'error'];
                                }
                            }
                        },
                        {
                            name: 'input_qty',
                            type: 'LineEdit',
                            title: self.ttr('Inbound Qty'),
                            property: {},
                            pack: {
                                label: self.ttr('Inbound Qty')
                            },
                            validate: function (obj, val, title, moment) {
                                this.getObject("good_qty").setData("value", val);
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'error'];
                                }
                                if (_.toNumber(val) <= 0) {
                                    return [title + self.ttr(" must be > 0!"), 'error'];
                                }
                            }
                        },
                        {
                            name: 'product_line',
                            type: 'LineEdit',
                            title: self.ttr('Product Line'),
                            property:
                            {
                                enabled: true
                            },
                            pack: {
                                label: self.ttr('Product Line')
                            }
                        },
                        {
                            name: 'start_time',
                            type: 'DateTimeEdit',
                            title: self.ttr('Plan Start Time'),
                            property: {},
                            pack: {
                                label: self.ttr('Plan Start Time')
                            },
                            validate: function (obj, val, title, moment2) {
                                importPackage("moment");
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'error'];
                                }
                                if (moment(val) > moment().format('YYYY-MM-DD HH:mm:ss')) {
                                    return [self.ttr("Start time error, please reset!"), 'error'];
                                }
                                if (_.toNumber(this.getObject("red_tag").getData("value")) == 1) {
                                    return ["", "", "color:red"];
                                }
                            }
                        },
                        {
                            name: '',
                            type: 'Widget'
                        },
                        {
                            name: 'quickly_finish',
                            type: 'CheckBox',
                            title: self.ttr('Quickly Finish'),
                            property: {},
                            pack: {
                                label: self.ttr('Quickly Finish')
                            }
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
                            }
                        },
                        {
                            name: 'rack_count',
                            type: 'LineEdit',
                            property: {},
                            state: function (obj, self) {
                                return 'Hide';
                            }
                        },
                        {
                            name: 'order_no',
                            type: 'LineEdit',
                            property: {},
                            state: function (obj, self) {
                                return 'Hide';
                            }
                        },
                        {
                            name: 'process_id',
                            type: 'LineEdit',
                            property: {},
                            state: function (obj, self) {
                                return 'Hide';
                            }
                        },
                        {
                            name: 'process_code',
                            type: 'LineEdit',
                            property: {},
                            state: function (obj, self) {
                                return 'Hide';
                            }
                        },
                        {
                            name: "red_tag",
                            type: "LineEdit",
                            title: self.ttr("Red Tag"),
                            state: function (obj, self) {
                                return 'Hide';
                            }
                        },
                        {
                            name: 'good_qty',
                            type: 'LineEdit',
                            title: self.ttr('Good Qty'),
                            state: function (obj, self) {
                                return 'Hide';
                            }
                        },
                    ]
                },
                {
                    type: 'Stretch'
                }
            ]
        }
    ];
}
