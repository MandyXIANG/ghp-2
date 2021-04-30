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
                property: { widget_resizable: true, frame_shape: 'NoFrame' },
                pack: { label: self.ttr("Navication") },
                child: {
                    name: 'layout',
                    type: 'FormLayout',
                    property: {
                        label_alignment: 'AlignRight',
                        margin: 10, vertical_spacing: 10, horizontal_spacing: 10,
                    },
                    pack: {},
                    child: [
                        {
                            name: 'current_date',
                            type: 'DateEdit',
                            title: self.ttr('Current Time'),
                            pack:
                            {
                                label: self.ttr('Current Time')
                            }
                        },
                        {
                            name: 'btn_list',
                            type: 'HBoxLayout',
                            property: { spacing: 0, margin: 0 },
                            pack: {
                                column_span: 1
                            },
                            child: [

                                {
                                    name: 'btnBrush',
                                    type: 'PushButton',
                                    pack:
                                    {
                                    },
                                    property:
                                    {
                                        text: self.ttr('Brush'), icon: 'eraser'
                                    },
                                    validate: function (obj, val, title, moment, self) {
                                    },
                                    callback: function (obj, clicked, self) {
                                        self.clearSearchValues();
                                        self.refresh();
                                    }
                                },
                                {
                                    name: 'btn',
                                    type: 'PushButton',
                                    pack:
                                    {

                                    },
                                    property:
                                    {
                                        text: self.ttr('Search'), icon: 'search'
                                    },
                                    validate: function (obj, val, title, moment, self) {

                                    },
                                    callback: function (obj, clicked, self) {
                                        self.onSearcheBtn();
                                    }
                                }
                            ]
                        },
                        {
                            name: 'strech',
                            type: 'Widget'
                        }
                    ]
                }
            },
        ]
    },

]
