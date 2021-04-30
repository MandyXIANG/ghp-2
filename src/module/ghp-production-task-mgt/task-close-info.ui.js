[
    {
        name: 'fglayout',
        type: 'FormGridLayout',
        property:
        {
            columns: 1,
            label_alignment: 'AlignTop | AlignRight',
            margin: 8,
        },
        pack: {},
        child: [
            {
                name: 'close_reason_label',
                type: 'Label',
                property: {
                    value: self.ttr('Close Reason')
                }
            },
            {
                name : 'close_reason',
                type : 'PlainTextEdit',
                property :
                {
                    vertical_scroll_bar_policy : 'ScrollBarAlwaysOn',
                    max_row_count : 5
                }
            }
        ]
    },
];


