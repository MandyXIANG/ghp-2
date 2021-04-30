function func(self) {
    return [{
        name: 'basic_info_widget',
        type: 'ScrollArea',
        property: { widget_resizable: true, frame_shape: 'NoFrame' },
        pack: { label: self.ttr("Basic Infomation") },
        child: {
            name: 'main_layout',
            type: 'VBoxLayout',
            property: { spacing: 0, margin: 0 },
            pack: {},
            child: [
                {
                    name: "splitter",
                    type: "Splitter",
                    property:
                    {
                        children_collapsible: false,
                        orientation: "Vertical",
                    },
                    child: [
                        {
                            name: 'tabwidget',
                            type: 'TabWidget',
                            property: {
                                maximum_height: 500
                            },
                            pack: { stretch: 1 },
                            child: [
                                {
                                    name: 'recommend_info_widget',
                                    type: 'ScrollArea',
                                    property: { widget_resizable: true, frame_shape: 'QFrame::NoFrame' },
                                    pack: { label: self.ttr("Inventory Details") },
                                    child: {
                                        name: 'v_sub_layout',
                                        type: 'VBoxLayout',
                                        property: { spacing: 0, margin: 0 },
                                        pack: {},
                                        child: [
                                            {
                                                name: 'INVENTORY_LIST',
                                                type: 'TableView',
                                                property: {
                                                    sort_indicator_shown: false,
                                                    header_popup_enabled: true
                                                },
                                                pack: {},
                                                getter: function (obj, self) {
                                                    return obj.allDataMap();
                                                },
                                                initCallback: function (obj) { }
                                            }
                                        ]
                                    }
                                }
                            ]
                        },
                        {
                            name: 'tabwidget',
                            type: 'TabWidget',
                            property: {
                                maximum_height: 500
                            },
                            pack: { stretch: 1 },
                            child: [
                                {
                                    name: 'MATERIAL_BOX_WIDEGT',
                                    type: 'Widget',
                                    property: { widget_resizable: true, frame_shape: 'QFrame::NoFrame' },
                                    pack: { label: self.ttr("Demand For Details") },
                                    child: {
                                        name: 'v_box_layout',
                                        type: 'VBoxLayout',
                                        property: { spacing: 0, margin: 0 },
                                        pack: {},
                                        child: [
                                            {
                                                name: 'MATERIAL_BOX_LIST',
                                                type: 'TableView',
                                                property: {
                                                    sort_indicator_shown: false,
                                                    header_popup_enabled: true
                                                },
                                                pack: {},
                                                getter: function (obj, self) {
                                                    return obj.allDataMap();
                                                },
                                                initCallback: function (obj) { }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }]
}