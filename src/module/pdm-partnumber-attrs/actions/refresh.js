try {
	var self = this;
	var partnumberId = self.uid();
	var selectedPn = self.userData("selected_pn");

	// 只加载一次ui  
	if (!this.userData("ui_setted")) {
		self.setUiKey("basic_info");
		self.setUserData("ui_setted", true);
	}

	if (_.isEmpty(selectedPn)) {
		self.uiLoader().loadValues({});
		this.refresh();
		return;
	}

	if (_.isEmpty(partnumberId)) return;

	var db = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
	var attrMap = db.selectMap({
		table: "mes_partnumber",
		field: ["id", "sys_version", "status", "partnumber", "partnumber_desc",		
			"attr_data->>'category' AS \"attr_data.category\"", "attr_data->>'group_name' AS \"attr_data.group_name\"",
			"attr_data->>'units' AS \"attr_data.units\"", "attr_data->>'create_time' AS \"attr_data.create_time\"",
			"attr_data->>'update_time' AS \"attr_data.update_time\"", "attr_data->>'product_line' AS \"attr_data.product_line\"",
			"attr_data->>'pn_raw' AS \"attr_data.pn_raw\"", "attr_data->>'pn_area' AS \"attr_data.pn_area\"",
			"attr_data->>'scrap_rate' AS \"attr_data.scrap_rate\"", "attr_data->>'rack_type' AS \"attr_data.rack_type\"",
			"attr_data->>'rack_qty' AS \"attr_data.rack_qty\"", "attr_data->>'rack_count' AS \"attr_data.rack_count\""],
		where:
		{
			id: partnumberId
		}

	});


	if (db.lastError().isValid()) throw self.ttr("Get attrs failed") + "!\n" + db.lastError().text();	

	self.uiLoader().loadValues(attrMap);
	self.refresh();
	self.alertOk(self.ttr("Load data finished") + "!");
	self.setDataModified(false);

} catch (e) {
	GUI.msgbox({ detail: e })
}

