importPackage('moment');
var self = this
var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())

var ui = {
	name: 'layout',
	type: 'FormLayout',
	property: {
		margin: 20,
		spacing: 10
	},
	child: [
		{
			name: 'schedule_type',
			type: 'ComboBox',
			property: { 
				item_list: TOPENM.enumList('mes-main-plan-schedule-type').toComboList()
			},
			pack: { label: self.ttr('Schedule Type') },
			validate: 'NOTNULL'
		},
		{
			name: 'timepoint',
			type: 'DateTimeEdit',
			property: {},
			pack: { label: self.ttr('Time Point') },
			validate: 'NOTNULL'
		}
	]
};

try {
    var ret = GUI.showForm({
		title: self.ttr('Schedule Process'),
		self: self,
		user_core_engine: true,
		items: ui,
		size: '400x200',
		buttons: [
			self.ttr('Ok') + ':Ok:Ok:Primary',
			self.ttr('Cancel') + ':Cancel:Cancel:Normal'
		],
		include_hidden_items: true,
		values: {}
	});
    if(_.isEmpty(ret)) return;
    var selectLst = self.selectedRows();
    if (selectLst.length <= 0) {
        return
    }
    _.forEach(selectLst, function (rowMap) {
        if (rowMap["status"] == "ordered") {
            var selector = new TSqlSelectorV2()
            selector.setTable('mes_main_plan')
            selector.setField(['plan_start_time'])
            selector.setWhere('id', rowMap['main_plan_id'], '=')
            var planRet = db.selectArrayMap(selector)
            if (db.lastError().isValid())
                throw db.lastError()
            if (planRet.length <= 0) {
                return true;
            }
            var mainPlanId = rowMap['main_plan_id'];
            self.loading(self.ttr("Scheduling..."), "", -1, 0);
            if (ret.schedule_type === 'start_time_asc') {
                self.scheduleProdOrder('from_start', ret.timepoint, mainPlanId);
            } else if (ret.schedule_type === 'stop_time_desc') {
                self.scheduleProdOrder('from_stop', ret.timepoint, mainPlanId);
            }
        }
    })

	this.unloading();
	self.reload();
} catch (e) {
	this.unloading();
	GUI.msgbox({type: 'error', text: 'Error', detail:e})
	print(e);
}

/*---ACTION---
ICON: "sort-amount-asc"
LABEL: "Schedule"
LABEL_ZHCN: "排程"
LABEL_ZHTW: "排程"
ACCEL: ""
TOOLTIP: "Schedule"
TOOLTIP_ZHCN: "排程"
TOOLTIP_ZHTW: "排程"
PERMISSION: "ghp-mes-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=icon"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.getStatus('ordered')) return 'enable';else return 'disable';"
---ACTION---*/