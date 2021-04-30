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
                                if (val.trim() == '') {
                                    return [title + self.ttr(" can not be null!"), 'error'];
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
                            validate: 'NOTNULL'
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
                        }
                    ]
                }
            },
        },
    ]
}
