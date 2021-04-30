[
    {
        name: 'add_widget',
        type: 'Widget',
        property: {},
        child: {
            name: 'vlayout',
            type: 'VBoxLayout',
            property: { spacing: 0, margin: 0 },
            pack: {},
            child: [
                {
                    name: 'qc_defect_table',
                    type: 'TableView',
                    property: {
                        header_popup_enabled: true
                    },
                    initCallback: function (obj) {
                        obj.setHeaderItem(
                            [
                                {
                                },
                                {
                                    "name": "code",
                                    "display": self.ttr("Code"),
                                    "resizeMode": "Interactive",
                                    "displayRole": "$code"
                                },
                                {
                                    "name": "title",
                                    "display": self.ttr("Title"),
                                    "resizeMode": "Interactive",
                                    "displayRole": "$title"
                                }
                            ]);
                        obj.setPrimaryKey("id");
                        obj.setDataKeyList(["id", "code", "title"]);
                        obj.setHeaderSortingEnabled(true);
                    },
                    getter: function (obj, self) {
                        //返回选中条目
                        return obj.selectedRowDataMaps(true);
                    },
                    setter: function (obj, value) {
                        if (value == null) {
                            value = [];
                        }
                        obj.loadData(value);
                    }
                }
            ]
        }
    }
]
