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
                name: 'certificate_name',
                type: 'LineEdit',
                title: 'Certificate Name',
                property: {},
                pack:
                {
                    label: self.ttr('Certificate Name')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'certificate_code',
                type: 'LineEdit',
                title: 'Certificate Code',
                property: {},
                pack:
                {
                    label: self.ttr('Certificate Code')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'career_level',
                type: 'LineEdit',
                title: 'Career Level',
                property: {},
                pack:
                {
                    label: self.ttr('Career Level')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'certificate_level',
                type: 'ComboBox',
                title: 'Certificate Level',
                property: { item_list: TOPENM.enumList('mes-certificate-level').toComboList() },
                pack:
                {
                    label: self.ttr('Certificate Level')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'end_date',
                type: 'DateEdit',
                title: 'End Date',
                property: {},
                pack:
                {
                    label: self.ttr('End Date')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'remark',
                type: 'LineEdit',
                title: 'Remark',
                property: {},
                pack:
                {
                    label: self.ttr('Remark')
                }
            },
            {
                type: "stretch"
            },
        ]
    },
];


