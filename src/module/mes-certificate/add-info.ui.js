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
                name: 'post',
                type: 'ComboBox',
                title: 'Post',
                property: { item_list: self.getPostList() },
                pack:
                {
                    label: self.ttr('Post')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'type',
                type: 'ComboBox',
                title: 'type',
                property: { item_list: TOPENM.enumList('mes-certificate-type').toComboList() },
                pack:
                {
                    label: self.ttr('Type')
                },
                validate: 'NOTNULL'
            },
            {
                name : 'start_date',
                type : 'DateEdit',
                title : self.ttr("Start Date"),
                property : {},
                pack : {
                    label : self.ttr('Start Date')
                },
                validate : 'NOTNULL'
            },
            {
                name : 'end_date',
                type : 'DateEdit',
                title : self.ttr("End Date"),
                property : {},
                pack : {
                    label : self.ttr('End Date')
                },
                validate: function (obj, val, title, moment2) {
                    importPackage("moment");
                    if (val.trim() == '') {
                        return [title + self.ttr(" can not be null!"), 'ERROR'];
                    }
                    var startDateTime = moment(this.getObject("start_date").getData("value"));
                    var endDateTime = moment(val);
                    if (endDateTime.isBefore(startDateTime)) {
                        return [self.ttr("Start date must less than end date"), 'ERROR'];
                    }
                }
            },
            {
                name: 'result',
                type: 'ComboBox',
                title: 'result',
                property: { item_list: TOPENM.enumList('mes-certificate-result').toComboList() },
                pack:
                {
                    label: self.ttr('Result')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'skill',
                type: 'ComboBox',
                title: 'skill',
                property: { item_list: TOPENM.enumList('mes-certificate-level').toComboList() },
                pack:
                {
                    label: self.ttr('Level')
                },
                validate: 'NOTNULL'
            },
            {
                name: 'remark',
                type: 'TextEdit',
                property: { vertical_scrollbar_policy: 'ScrollBarAlwaysOff', accept_rich_text: false, max_row_count: 4 },
                title: self.ttr('Remark'),
                pack: { label: self.ttr('Remark') },
                getter: function (obj) {
                    return obj.plainText;
                }
            },
            {
                type: "stretch"
            },
        ]
    },
];


