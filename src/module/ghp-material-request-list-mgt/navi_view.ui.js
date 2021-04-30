function func(self) {
    importPackage("mes.core");
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
                            name: 'flayout',
                            type: 'FormLayout',
                            property: { label_alignment: 'AlignRight', margin: 10, vertical_spacing: 10, horizontal_spacing: 10 },
                            pack: {},
                            child: [
                                {
                                    name: 'category',
                                    type: 'MultiComboBox',
                                    title: self.ttr('Category'),
                                    property: {item_list: MesDataStore.getAttrOptionList("partnumber_category")},
                                    pack: {
                                        label: self.ttr('Category')
                                    },
                                    initCallback: function (obj, self) {
                                        obj.selectAll(true);
                                    }
                                },
                                {
                                    name: 'group_name',
                                    type: 'LineEdit',
                                    title: self.ttr('Group Name'),
                                    property: {
                                        user_data: {
                                            operator: "like"
                                        }
                                    },
                                    pack: {
                                        label: self.ttr('Group Name')
                                    },
                                },
                                {
                                    name: 'plan_start_time',
                                    type: 'DateEdit',
                                    title: self.ttr('Plan Start Time'),
                                    property: {
                                        user_data: { field_name: "plan_start_time", operator: '>=' }
                                    },
                                    pack: {
                                        label: self.ttr('Plan Start Time')
                                    },
                                },
                                {
                                    name: 'plan_end_time',
                                    type: 'DateEdit',
                                    title: self.ttr('Plan End Time'),
                                    property: {
                                        user_data: { field_name: "plan_start_time", operator: '<=' }
                                    },
                                    pack: {
                                        label: self.ttr('Plan End Time')
                                    }
                                },
                                {
                                    name: 'botton_list',
                                    type: 'HBoxLayout',
                                    property: { spacing: 10, margin: 0 },
                                    pack: {
                                        column_span: 1
                                    },
                                    child: [
                                        {
                                            name: 'btnBrush',
                                            type: 'PushButton',
                                            pack: {},
                                            property: {
                                                text: self.ttr('Brush'), icon: 'eraser',
                                                minimum_size: { width: 50 },
                                            },
                                            callback: function (obj, clicked, self) {
                                                this.clearValues();
                                                self.refresh();
                                            }
                                        },
                                        {
                                            name: 'btn',
                                            type: 'PushButton',
                                            pack: {},
                                            property: {
                                                text: self.ttr('Search'), icon: 'search',
                                                minimum_size: { width: 50 },
                                            },
                                            callback: function (obj, clicked, self) {
                                                self.refresh();
                                            }
                                        }
                                    ]
                                },
                                {
                                    name: 'stretcher',
                                    type: 'Widget',
                                    property: { size_policy: 'Qt::Expanding' }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ];
}