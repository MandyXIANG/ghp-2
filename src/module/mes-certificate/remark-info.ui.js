[
	{
		name : 'wgt',
		type : 'Widget',
		title : self.ttr('Wgt'),
		property : {},
		pack :{
			label : self.ttr('Wgt')
		},
		child : {
			name : 'layout',
			title : self.ttr('Layout'),
			type : 'FormLayout',
			 property : 
			{
				horizontal_spacing : 20,
				label_alignment : 'Top | Right',
				margin : 20,
				vertical_spacing : 10
			},
			child : [
				{
					name: 'remark',
					type: 'TextEdit',
					property: { vertical_scrollbar_policy: 'ScrollBarAlwaysOff', accept_rich_text: false, min_row_count: 4 },
					title: self.ttr('Reason'),
					pack: { label: self.ttr('Reason') },
					getter: function (obj) {
						return obj.plainText;
                    },
                    validate : 'NOTNULL'
				}
			]
		}
	}
]