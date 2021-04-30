function func(self) {
    return [
        {
            name: 'product_wgt',
            type: 'TabWidget',
            title: self.ttr('Product Infomation'),
            child: {
                name: 'product_info_widget',
                type: 'ScrollArea',
                property: { widget_resizable: true, frame_shape: 'QFrame::NoFrame' },
                pack: { label: self.ttr("Product Infomation") },

                child: {
                    name: 'order_formlayout',
                    type: 'FormGridLayout',
                    property:
                    {
                        columns: 2,
                        label_alignment: 'AlignTop | AlignRight',
                        margin: 20,
                        separator: '',
                    },
                    pack: {},
                    child: [
                        {
                            name: 'plan_title',
                            type: 'LineEdit',
                            title: self.ttr('Plan Title Product'),
                            property: {
                                enabled: false
                            },
                            pack: {
                                label: self.ttr('Plan Title Product'),
                                column_span: 1
                            },
                            validate: 'NOTNULL'
                        },
                        {
                            name: 'priority',
                            type: 'ComboBox',
                            title: self.ttr('Priority'),
                            property: {
                                item_list: TOPENM.enumList("mps-main-plan-priority").toComboList()
                            },
                            pack: {
                                label: self.ttr('Priority'),
                                column_span: 1
                            }
                        },
                        {
                            name: 'plan_type',
                            type: 'ComboBox',
                            title: 'Plan Type',
                            property: { item_list: TOPENM.enumList("mps-prod-order-type").toComboList() },
                            pack:
                            {
                                label: self.ttr('Plan Type')
                            },
                            validate: 'NOTNULL'
                        },
                        {
                            name: 'output_count',
                            type: 'LineEdit',
                            title: self.ttr('Output Count Product'),
                            property: {
                                enabled: true
                            },
                            pack: {
                                label: self.ttr('Output Count Product'),
                                column_span: 1
                            },
                            validate: function (obj, val, title, moment) {
                                var dataMap = self.getCheckData();
                                var allowCount = dataMap["output_count_order"] - dataMap["input_qty_sum"];
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'error'];
                                }
                                if (_.toNumber(val) > allowCount) {
                                    return [self.ttr("It can be put into production up to ") + allowCount + self.ttr(",please input again!"), 'ERROR'];
                                }
                            }
                        },
                        {
                            name: 'input_time',
                            type: 'DateTimeEdit',
                            title: self.ttr('Input Time Product'),
                            property: {
                                enabled: true
                            },
                            pack: {
                                label: self.ttr('Input Time Product'),
                                column_span: 1
                            },
                            validate: function (obj, val, title, moment2) {
                                importPackage("moment");
                                if (moment2 == "LOAD") {
                                    var dateTime = moment(moment().format('YYYY-MM-DD')).add(7, 'h').format('YYYY-MM-DD HH:ss:mm');
                                    obj.setData("value", dateTime);
                                    val = dateTime;
                                }
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'error'];
                                }
                                var outputTime = moment(val).add(1, 'days').format('YYYY-MM-DD HH:ss:mm');
                                this.getObject("output_time").setData("value", outputTime);
                            }
                        },
                        {
                            name: 'output_time',
                            type: 'DateTimeEdit',
                            title: self.ttr('Output Time Product'),
                            property: {
                                enabled: true
                            },
                            pack: {
                                label: self.ttr('Output Time Product'),
                                column_span: 1
                            },
                            validate: function (obj, val, title, moment2) {
                                importPackage("moment");
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'error'];
                                }
                                var inputTime = moment(this.getObject("input_time").getData("value"));
                                var outputTime = moment(val);
                                if (outputTime.isBefore(inputTime)) {
                                    return [title + self.ttr("The end time should be greater than the start time"), 'error'];
                                }
                            }
                        },
                        {
                            name: 'partnumber',
                            type: 'LineEdit',
                            title: self.ttr('Partnumber'),
                            property: {
                                enabled: false
                            },
                            pack: {
                                label: self.ttr('Partnumber'),
                                column_span: 1
                            },
                            state: function () {
                                return 'Hide';
                            }
                        },
                        {
                            name: 'stretch',
                            type: 'Stretch'
                        }
                    ]
                }
            },
        },
    ]
}
