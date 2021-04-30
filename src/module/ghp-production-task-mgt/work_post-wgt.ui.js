function func(self) {
    return [
        {
            name: 'vlayout',
            type: 'VBoxLayout',
            property: {
                margin: 0, spacing: 10
            },
            child: [
                {
                    name: 'forgridlayout1',
                    type: 'FormGridLayout',
                    property: {
                        label_alignment: 'AlignRight', margin: 10, vertical_spacing: 10, horizontal_spacing: 20
                    },
                    child: [
                        {
                            name: "card_code",
                            type: "LineEdit",
                            title: self.ttr("Card Code"),
                            property: { enabled: true },
                            pack: { label: self.ttr("Card Code") }
                        }
                    ]
                },
                {
                    name: "employee_info",
                    type: "TitleExpander",
                    property: { text: self.ttr("Employ Info"), expanded: true },
                    pack: { layout_type: 2 },
                    child: {
                        name: 'forgridlayout2',
                        type: 'FormGridLayout',
                        property: {
                            label_alignment: 'AlignRight',
                            margin: 10, vertical_spacing: 10,
                            horizontal_spacing: 10,
                            columns: 2,
                        },
                        child: [
                            {
                                name: "staffid",
                                type: "LineEdit",
                                property: {
                                    maximum_size: 150
                                },
                                title: self.ttr("Staffid"),
                                pack: { label: self.ttr("Staffid") },
                                state: function (obj, self) {
                                    return 'Disable';
                                }
                            },
                            {
                                name: "fullname",
                                type: "LineEdit",
                                property: {
                                    maximum_size: 150
                                },
                                title: self.ttr("Fullname"),
                                pack: { label: self.ttr("Fullname") },
                                state: function (obj, self) {
                                    return 'Disable';
                                }
                            }
                        ]
                    }
                }
            ]
        }
    ];
}
