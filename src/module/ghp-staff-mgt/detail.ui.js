function fun(self) {

	function getData() {
		var serialNum = 0;
		var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
		try {
			var selector = new TSqlSelectorV2;
			var reg = new RegExp("-", "g");
			selector.setTable("sys_user");
			selector.setField("MAX(CAST(username AS name))");
			selector.setWhere("username", (_.format("staffmgt_{0}%", _.toString(APP.getServerToday()))).replace(reg, ""), "LIKE");
			var data = db.selectMap(selector);
			if(db.lastError().isValid()){
				throw db.lastError().text();
			}
			if (data.length == 0) {
				serialNum = 1;
			} else {
				var sqlUsernameStr = _.toString(data["max"]);
				var strLength = sqlUsernameStr.length;
				var tmpNum = sqlUsernameStr.substring(strLength-5, strLength);
				serialNum = _.toNumber(tmpNum) + 1;
			}
			return (Array(5).join('0') + serialNum).slice(-5);
		} catch(e) {
			print(e);
		}
	}


	return[
		{
			name : 'tabwidget',
			type : 'TabWidget',
			property : {            
			},
			pack : {stretch : 1},
			child : [
				{
					name : 'staff_info_widget',
					type : 'ScrollArea',
					property : {widget_resizable : true, frame_shape : 'QFrame::NoFrame'},
					pack : {label : self.ttr("Staff Information")},
					child : {
						name : 'staff_formlayout',
						type : 'FormLayout',
						property :
						{
							label_alignment:'AlignRight',
							horizontal_spacing:20,vertical_spacing:10,margin:20
						},
						pack : {},
						child : [
							{
								name : 'id',
								type : 'LineEdit',
								title : self.ttr('ID'),
								property :{enabled : false},
								pack :{ label : self.ttr('ID')},
								state : function(obj) {
									return 'hide';
								}
							},
							{
								name : 'fullname',
								type : 'LineEdit',
								title : self.ttr('Fullname'),
								property : {},
								pack : {
									label : self.ttr('Fullname')
								},
								validate: 'NOTNULL'
							},
							{
								name : 'attr_data.sex',
								type : 'ComboBox',
								title : self.ttr('Sex'),
								property : {
									item_list: TOPENM.enumList("ghp-mes-staff-sex").toComboList(),  enabled: true 
								},
								pack : {
									label : self.ttr('Sex')
								}
							},
							{
								name : 'staffid',
								type : 'LineEdit',
								title : self.ttr('Staff Id'),
								property :{},
								pack : {
									label : self.ttr('Staff Id')
								},
								validate :  function (obj, val, title, moment2) {
									if (val.trim() == '') {
										return [title + self.ttr(" can not be null!"), 'error'];
									}
									var reg = new RegExp("-", "g");
									var serialNum =  getData();
									this.getObject("username").setData("value", (_.format("staffmgt_{0}{1}", _.toString(APP.getServerToday()), serialNum)).replace(reg, ""));
									this.getObject("action_data.modify_time").setData("value",_.toString(APP.getServerNow()));
									this.getObject("action_data.modify_oper").setData("value",_.toString(APP.userFullname()));
								},
								callback: function (obj, checked, self) {
									
								}
							},
							{
								name : 'attr_data.card_code',
								type : 'LineEdit',
								title : self.ttr('Card Code'),
								property :{},
								pack : { label : self.ttr('Card Code') },
								validate : 'NOTNULL'
							},
							{
								name : 'status',
								type : 'ComboBox',
								title : self.ttr('Status'),
								property :{
									item_list: TOPENM.enumList("ghp-mes-staff-status").toComboList(),  enabled: false 
								},
								pack :{label : self.ttr('Status')}
							},
							{
								name: 'remark',
								type: 'PlainTextEdit',
								title: self.ttr('Remark'),
								property: { vertical_scroll_bar_policy: 'ScrollBarAlwaysOff' },
								pack: { label: self.ttr('Remark') }
							},
							{
								name : 'username',
								type : 'LineEdit',
								title : self.ttr('User Name'),
								property :{enabled : false},
								pack :{ label : self.ttr('User Name')},
								state : function(obj) {
									return 'hide';
								}
							},
							{
								name : 'product_category',
								type : 'LineEdit',
								title : self.ttr('Product Category'),
								property :{enabled : false},
								pack :{ label : self.ttr('Product Category')},
								state : function(obj) {
									return 'hide';
								}
							},
							{
								name : 'action_data.create_time',
								type : 'LineEdit',
								title : self.ttr('Create Time'),
								property :{enabled : false},
								pack :{ label : self.ttr('Create Time')},
								state : function(obj) {
									return 'hide';
								}
							},
							{
								name : 'action_data.creator',
								type : 'LineEdit',
								title : self.ttr('Creator'),
								property :{enabled : false},
								pack :{ label : self.ttr('Creator')},
								state : function(obj) {
									return 'hide';
								}
							},
							{
								name : 'action_data.modify_time',
								type : 'LineEdit',
								title : self.ttr('Modify Time'),
								property :{enabled : false},
								pack :{ label : self.ttr('Modify Time')},
								state : function(obj) {
									return 'hide';
								}
							},
							{
								name : 'action_data.modify_oper',
								type : 'LineEdit',
								title : self.ttr('Modify Oper'),
								property :{enabled : false},
								pack :{ label : self.ttr('Modify Oper')},
								state : function(obj) {
									return 'hide';
								}
							}
						]
					}
				}	
			]
		}
	]
}