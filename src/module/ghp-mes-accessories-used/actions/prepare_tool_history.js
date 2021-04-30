var self = this;
try {
	var uid = self.uid();
	var filter_ui = {
		type: 'FormGridLayout',
		child: [
			{
				name: 'search_keys',
				type: 'MultiComboBox',
				pack: { label: self.ttr('Search Key') },
				property: {
					item_list: TOPENM.enumList("ghp-mes-transaction-type").toComboList()
				}
			},
			{
				name: 'timing1',
				type: 'DateTimeEdit',
				pack: { label: self.ttr('Timing') },
				property: {
					user_data: { field_name: "'timing'", operator: '>=' }
				}
			},
			{
				name: 'timing2',
				type: 'DateTimeEdit',
				pack: {},
				property: {
					user_data: { field_name: "'timing'", operator: '<=' }
				}
			}
		]
	};
	var table_conf = {
		"horizontal_header": [
			{
				"name": "search_keys",
				"display": "Search Key",
				"displayRole": "$search_keys.text",
				"resizeMode": "ResizeToContents",
				"search": "String",
				"format": "enum(ghp-mes-transaction-type)"
			},
			{
				"name": "lot_no",
				"display": "Lot No",
				"displayRole": "$lot_no",
				"resizeMode": "ResizeToContents"
			},
			{
				"name": "location_code",
				"display": "Location Code",
				"displayRole": "$location_code",
				"resizeMode": "ResizeToContents"
			},
			{
				"name": "current_bits_count",
				"display": "Current Count",
				"displayRole": "$current_bits_count",
				"resizeMode": "ResizeToContents"
			},
			{
				"name": "timing",
				"display": "Timing",
				"displayRole": "$current_bits_count",
				"resizeMode": "ResizeToContents"
			},
			{
				"name": "action_data.oper",
				"display": "Oper",
				"displayRole": "$action_data.oper",
				"resizeMode": "ResizeToContents"
			},
			{
				"name": "material_spec.type",
				"display": "Type",
				"displayRole": "$material_spec.type.text",
				"resizeMode": "ResizeToContents",
				"format": "enum(ghp-mes-share-accessories-type)"
			},
			{
				"name": "material_code",
				"display": "Material Code",
				"displayRole": "$material_code",
				"resizeMode": "ResizeToContents"
			},
			{
				"name": "material_name",
				"display": "Material Name",
				"displayRole": "$material_name",
				"resizeMode": "ResizeToContents"
			},
			{
				"name": "attr_data.remark",
				"display": "Remark",
				"displayRole": "$attr_data.remark",
				"resizeMode": "ResizeToContents"
			}
		],
		"data_keys": ["search_keys", "lot_no", "location_code", "current_bits_count", "timing", "action_data", "material_spec", "material_code", "material_name", "attr_data"],
		"primary_key": "id",
		"sort_by": "timing DESC",
		"data_set": {
			"db_table_name": "wms_warehouse_inventory_snapshot",
			"db_del_flag_key": "",
			"db_filter": {
				"attr_data->>'workcenter_id'": uid,
				"tags": '{accessories}'
			}
		}
	};
	var ret = GUI.showFilterTableDialog({
		size: '1200x720',
		self: self,
		title: self.ttr("History Info"),
		buttons: [self.ttr("Ok") + ":Ok:Ok:Primary"],
		use_core_engine: true,
		filter_items: filter_ui,
		table_conf: table_conf
	});
	if (_.isEmpty(ret)) {
		return;
	}

} catch (e) {
	GUI.msgbox({ type: 'ERROR', title: self.ttr('Error'), text: e });
}


/*---ACTION---
ICON: "history"
LABEL: "Show History Info"
LABEL_ZHCN: "历史信息"
LABEL_ZHTW: "歷史信息"
ACCEL: ""
TOOLTIP: "Show History Info"
TOOLTIP_ZHCN: "历史信息"
TOOLTIP_ZHTW: "歷史信息"
PERMISSION: "spumes2-mes-accessories-used-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/