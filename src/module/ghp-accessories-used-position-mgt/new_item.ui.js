function func(self) {
    var workcenterId = self.uid();
    return [
        {
            type: 'ScrollArea',
            property: {
                widget_resizable: true,
                frame_shape: 'NoFrame'
            },
            child: {
                name: "main_frame",
                type: "FormGridLayout",
                property: {
                    label_alignment: "AlignVCenter",
                    margin: 10,
                    spacing: 10
                },
                child: [
                    {
                        name: "json_data.name",
                        title: self.ttr("Name"),
                        type: "LineEdit",
                        validate: function (obj, val, title, moments, self) {
                            if (val.trim() == "") {
                                return [title + self.ttr(" can not be null!"), "Error"];
                            } 
                            else {
                                var dataLst = self.tableView().allDataMap();
                                var rowDataMap = _.result(self.selectedDataMaps(), '0', {});
                                var exists = false;
                                _.each(dataLst, function(item) {
                                    if (val.trim() == item["json_data.name"] && item["json_data.name"] != rowDataMap["json_data.name"]) {
                                        exists = true;
                                    }
                                })
                                if (exists) return [title + self.ttr(" already exists!"), "Error"];
                            }
                        }
                    },
                    {
                        name: "json_data.text",
                        type: "LineEdit",
                        title: self.ttr("Text"),
                        validate: 'NotNull'
                    },
                    {
                        name: "json_data.remark",
                        type: "LineEdit",
                        title: self.ttr("Remark"),
                    },
                    {
                        name: "param_name",
                        type: "LineEdit",
                        title: self.ttr("Param Name"),
                        state: function() { return "Hide" },
                        setter: function (obj, value, self) {
                            obj.setText("accessories_used_position");
                        }
                    },
                    {
                        name: "workcenter_id",
                        type: "LineEdit",
                        title: self.ttr("Workcenter Id"),
                        validate: 'NotNull',
                        state: function (obj, self) {
                            return 'hide'
                        },
                        setter: function (obj, value, self) {
                            obj.setText(workcenterId);
                        }
                    },
                    {
                        type: "Stretch"
                    }
                ]
            }
        }
    ];
}