[
    {
        name: 'Splitter',
        type: 'Splitter',
        property:
        {
            children_collapsible: false,
            orientation: "Vertical",
            stylesheet: "QSplitter::handle{background:#D5D5D5}"
        },
        pack: {},
        child: [
            {
                name: 'processwidget',
                type: 'TabWidget',
                title: self.ttr('Process information'),
                property: {
                    maximum_height: 800
                },
                pack: {
                    stretch: 1
                },
                child: [
                    {
                        name: 'process_view',
                        type: 'TreeView',
                        property: {},
                        pack: { label: self.ttr("Process Information") }
                    }
                ]
            },
            {
                name: 'reportwidget',
                type: 'TabWidget',
                title: self.ttr('Report information'),
                property: {
                    maximum_height: 800
                },
                pack: {
                    stretch: 1
                },
                child: [
                    {
                        name: 'report_view',
                        type: 'TableView',
                        property: {},
                        pack: { label: self.ttr("Report Information") },
                        getter: function (obj, self) {
                            return obj.allDataMap();
                        },
                        initCallback: function (obj) {
                            obj.setHeaderItem(
                                [
                                    {
                                        "name": "id",
                                        "display": self.ttr("Id"),
                                        "resizeMode": "Interactive",
                                        "size": "100",
                                        "displayRole": "$id"
                                    },
                                    {
                                        "name": "prod_workshift",
                                        "display": self.ttr("Prod Workshift"),
                                        "resizeMode": "Interactive",
                                        "size": "60",
                                        "displayRole": "$prod_workshift"
                                    },
                                    {
                                        "name": "lot_no",
                                        "display": self.ttr("Lot No"),
                                        "resizeMode": "Interactive",
                                        "size": "100",
                                        "displayRole": "$lot_no"
                                    },
                                    {
                                        "name": "current_bits_count",
                                        "display": self.ttr("Current Count"),
                                        "resizeMode": "Interactive",
                                        "size": "100",
                                        "displayRole": "$current_bits_count"
                                    },
                                    {
                                        "name": "short_lot_no",
                                        "display": self.ttr("Short Lot No"),
                                        "resizeMode": "Interactive",
                                        "size": "70",
                                        "displayRole": "$short_lot_no"
                                    },
                                    {
                                        "name": "input_qty",
                                        "display": self.ttr("Input Qty"),
                                        "resizeMode": "Interactive",
                                        "size": "60",
                                        "displayRole": "$input_qty"
                                    },
                                    {
                                        "name": "output_qty",
                                        "display": self.ttr("Output Qty"),
                                        "resizeMode": "Interactive",
                                        "size": "60",
                                        "displayRole": "$output_qty"
                                    },
                                    {
                                        "name": "scrap_qty",
                                        "display": self.ttr("Scrap Qty"),
                                        "resizeMode": "Interactive",
                                        "size": "60",
                                        "displayRole": "$scrap_qty"
                                    },
                                    {
                                        "name": "diff_qty",
                                        "display": self.ttr("Diff Qty"),
                                        "resizeMode": "Interactive",
                                        "size": "60",
                                        "displayRole": "$diff_qty"
                                    },
                                    {
                                        "name": "actual_start_time",
                                        "display": self.ttr("Actual Start Time"),
                                        "resizeMode": "Interactive",
                                        "size": "160",
                                        "displayRole": "$actual_start_time"
                                    },
                                    {
                                        "name": "actual_end_time",
                                        "display": self.ttr("Actual End Time"),
                                        "resizeMode": "Interactive",
                                        "size": "160",
                                        "displayRole": "$actual_end_time"
                                    },
                                    // {
                                    //     "name": "prod_workshift_detail",
                                    //     "display": self.ttr("Prod Workshift Detail"),
                                    //     "resizeMode": "Interactive",
                                    //     "size": "100",
                                    //     "flagsRole": "ItemIsEnabled|ItemIsSelectable|ItemIsEditable",
                                    //     "editRole": "$prod_workshift_detail",
                                    //     "foregroundRole": "#FB5200"
                                    // }
                                    {
                                        "name": "create_site",
                                        "display": self.ttr("Create Site"),
                                        "resizeMode": "Interactive",
                                        "size": "160",
                                        "displayRole": "$create_site.text"
                                    }
                                ]);
                            obj.setDataKeyList(["id", "prod_workshift", "lot_no", "short_lot_no", "input_qty", "output_qty", "scrap_qty", "diff_qty", "actual_start_time", "actual_end_time", "prod_workshift_detail", "status", "current_bits_count", "islotend", "create_site", "create_site.text"]);
                            obj.setPrimaryKey("id");
                        }
                    }
                ]
            }, {
                name: 'teamwidget',
                type: 'TabWidget',
                title: self.ttr('Team Infomation'),
                property: {
                    maximum_height: 300
                },
                pack: {
                    stretch: 1
                },
                child: [
                    {
                        name: 'team_view',
                        type: 'TableView',
                        property: {},
                        pack: { label: self.ttr("Team Infomation") },
                        getter: function (obj, self) {
                            return obj.allDataMap();
                        },
                        initCallback: function (obj) {
                            obj.setHeaderItem(
                                [
                                    {
                                        "name": "id",
                                        "display": self.ttr("Id"),
                                        "resizeMode": "Interactive",
                                        "size": "100",
                                        "displayRole": "$id"
                                    },
                                    {
                                        "name": "workshift",
                                        "display": self.ttr("Workshift"),
                                        "resizeMode": "Interactive",
                                        "size": "100",
                                        "displayRole": "$workshift"
                                    },
                                    {
                                        "name": "ok_qty",
                                        "display": self.ttr("Ok Qty"),
                                        "resizeMode": "Interactive",
                                        "size": "100",
                                        "displayRole": "$ok_qty"
                                    },
                                    {
                                        "name": "ng_qty",
                                        "display": self.ttr("Ng Qty"),
                                        "resizeMode": "Interactive",
                                        "size": "100",
                                        "displayRole": "$ng_qty"
                                    }
                                ]);
                            obj.setDataKeyList(["id", "workshift", "ok_qty", "ng_qty"]);
                            obj.setPrimaryKey("id");
                        }
                    }
                ]
            }
        ]
    },
]

