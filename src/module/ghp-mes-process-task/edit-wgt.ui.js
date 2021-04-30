[
    {
        name: 'order_formlayout',
        type: 'FormGridLayout',
        property:
        {
            columns: 1,
            label_alignment: 'AlignTop | AlignRight',
            margin: 20,
            separator: '',
        },
        pack: {},
        child: [
            {
                name: 'input_qty',
                type: 'LineEdit',
                title: self.ttr('Input Qty'),
                property: {
                    enabled: true
                },
                pack: {
                    label: self.ttr('Input Qty'),
                    column_span: 1
                },
                validate: 'NOTNULL'
            },
            {
                name: 'output_qty',
                type: 'LineEdit',
                title: self.ttr('Output Qty'),
                property: {
                    enabled: true
                },
                pack: {
                    label: self.ttr('Output Qty'),
                    column_span: 1
                },
                validate: 'NOTNULL'
            },{
                name: 'scrap_qty',
                type: 'LineEdit',
                title: self.ttr('Scrap Qty'),
                property: {
                    enabled: true
                },
                pack: {
                    label: self.ttr('Scrap Qty'),
                    column_span: 1
                },
                validate: 'NOTNULL'
            },
            {
                name: 'diff_qty',
                type: 'LineEdit',
                title: self.ttr('Diff Qty'),
                property: {
                    enabled: true
                },
                pack: {
                    label: self.ttr('Diff Qty'),
                    column_span: 1
                },
                validate: 'NOTNULL'
            },
            {
                name: 'islotend',
                type: 'CheckBox',
                title: self.ttr('Islotend'),
                property: {
                    enabled: true
                },
                pack: {
                    label: self.ttr('Islotend'),
                    column_span: 1
                }
            },
            {
                name: 'stretcher',
                type: 'Widget',
                property: { size_policy: 'Qt::Expanding' }
            }
        ]
    }
]

