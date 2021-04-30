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
                                    property: {
                                        label_alignment: 'AlignRight',
                                        margin: 10,
                                        vertical_spacing: 10,
                                        horizontal_spacing: 10,
                                        columns: 2},
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
                                            name: 'start_time',
                                            type: 'DateTimeEdit',
                                            title: self.ttr('Plan Start Time'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Plan Start Time')
                                            },
                                            validate: function (obj, val, title, moment2) {
                                                importPackage("moment");
                                                try{
                                                    if (val.trim() == '') {
                                                        return [title + self.ttr(" can not be null!"), 'error'];
                                                    }
                                                    if (moment(val) > moment()) {
                                                        return [self.ttr("Start time error, please reset!"), 'error'];
                                                    }
                                                    if (_.toNumber(this.getObject("red_tag").getData("value")) == 1) {
                                                        return ["", "", "color:red"];
                                                    }
                                                } catch(e) {
                                                    print(e);
                                                }
                                            }
                                        },
                                        {
                                            name: 'serial_no',
                                            type: 'LineEdit',
                                            title: self.ttr('Serial Number'),
                                            property:
                                            {
                                                enabled: false
                                            },
                                            pack: {
                                                label: self.ttr('Serial Number')
                                            }
                                        },
                                        {
                                            name: 'stage1_dmc',
                                            type: 'LineEdit',
                                            title: self.ttr('Stage1 Dmc'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Stage1 Dmc')
                                            },
                                            initCallback:function(obj,self) {
                                                if (self.isFirstProcess()) {
                                                    obj.setData("enabled", true);
                                                } else {
                                                    obj.setData("enabled", false);
                                                }
                                            },
                                            validate: 'notNull'
                                        },
                                        {
                                            name: 'stage2_dmc',
                                            type: 'LineEdit',
                                            title: self.ttr('Stage2 Dmc'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Stage2 Dmc')
                                            },
                                            initCallback:function(obj,self) {
                                                if (self.isFirstProcess()) {
                                                    obj.setData("enabled", true);
                                                } else {
                                                    obj.setData("enabled", false);
                                                }
                                            },
                                            validate: 'notNull'
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
                                            },
                                            initCallback:function(obj,self) {
                                                if (self.isFirstProcess()) {
                                                    obj.setData("enabled", true);
                                                } else {
                                                    obj.setData("enabled", false);
                                                }
                                            }
                                        },
                                        {
                                            name: 'rack_qty',
                                            type: 'LineEdit',
                                            title: self.ttr('Rack Qty'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Rack Qty')
                                            },
                                            initCallback:function(obj,self) {
                                                if (self.isFirstProcess()) {
                                                    obj.setData("enabled", true);
                                                } else {
                                                    obj.setData("enabled", false);
                                                }
                                                obj['returnPressed()'].connect(this, function () {
                                                    var rackCount = _.toNumber(this.getObject("rack_count").getData("value"));
                                                    var inputQty = _.toNumber(obj.getData("value")) * rackCount;
                                                    this.getObject("input_qty").setData("value", inputQty);
                                                });
                                            },
                                            validate: function (obj, val, title, moment) {
                                                if (self.isFirstProcess()) {
                                                    if (_.toNumber(val) <= 0) {
                                                        return [title + self.ttr(" must be > 0!"), 'error'];
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            name: 'product_line',
                                            type: 'LineEdit',
                                            title: self.ttr('Product Line'),
                                            property:
                                            {
                                                enabled: false
                                            },
                                            pack: {
                                                label: self.ttr('Product Line')
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
                                            name: 'quickly_finish',
                                            type: 'CheckBox',
                                            title: self.ttr('Quickly Finish'),
                                            property: {},
                                            pack: {
                                                label: self.ttr('Quickly Finish')
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
                                            initCallback:function(obj,self) {
                                                if (self.isFirstProcess()) {
                                                    obj.setData("enabled", true);
                                                } else {
                                                    obj.setData("enabled", false);
                                                }
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
                                        {
                                            name: 'rack_count',
                                            type: 'LineEdit',
                                            property: {},
                                            state: function (obj, self) {
                                                return 'Hide';
                                            }
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