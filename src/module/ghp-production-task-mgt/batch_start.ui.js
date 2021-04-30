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
                                    property: { label_alignment: 'AlignRight', margin: 10, vertical_spacing: 10, horizontal_spacing: 10, columns: 1 },
                                    pack: {},
                                    child: [
                                        {
                                            name: 'start_time',
                                            type: 'DateTimeEdit',
                                            title: self.ttr('Plan Start Time'),
                                            property:
                                            {},
                                            pack: {
                                                label: self.ttr('Plan Start Time')
                                            },
                                            validate: 'notNull'
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