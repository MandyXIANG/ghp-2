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
                    property: {
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
                                    name: 'prepare_type',
                                    type: 'ComboBox',
                                    title: self.ttr('Accessories Type'),
                                    property: { item_list: TOPENM.enumList("ghp-mes-share-accessories-type").toComboList() },
                                    pack: {
                                        label: self.ttr('Accessories Type')
                                    }
                                },
                                {
                                    name: 'btn_list',
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
                                                text: self.ttr('Brush'), icon: 'eraser'
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
                                            },
                                            callback: function (obj, clicked, self) {
                                                self.onSearchBtnClicked();
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