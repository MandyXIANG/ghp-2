var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase())

try {
	t.saving(this);
	var self = this;
	var uiloaderObj = this.uiLoader();
	var uiErrStrList = uiloaderObj.validateAll("COMMIT", true, "ERROR");

	if (!_.fuzzyEqual(uiErrStrList.length, 0)) {
		var errStrLst = [];
		for (var errCot = 0; errCot < uiErrStrList.length; errCot++) {
			errStrLst.push(_.toString(uiErrStrList[errCot]["text"]));
		}

		throw errStrLst.join("\n");
	}

	var dataMap = uiloaderObj.getAllValues(true);

	if (_.isEmpty(dataMap)) {
		this.unloading();
		return;
	}

	//获取待保存数据
	var saveFieds = this.config("save_fields");
	if (_.isEmpty(saveFieds)) {
		saveFieds = ["name", "sex", "status", "source", "source_serial", "company"
			, "department", "title", "remark", "nick_name", "address", "phone"
			, "mail", "fax", "other_mail", "idcard", "birth_date", "hobby", "other_contact"
			, "category", "security_level", "head_portrait", "tags"];
	}
	var dbDataMap = TDataParse.fetchVariantMapField(dataMap, saveFieds);
	if (_.fuzzyGreaterThan(_.toNumber(this.uid()), 0)) {
		dbDataMap["id"] = this.uid();
	}

	dbDataMap = TDataParse.replaceVariantMapEmptyItem(dbDataMap);
	dbDataMap["category"] = [_.toString(dbDataMap["category"])];


	query.begin();

	var contactId = "";
	var fieldLst = Object.keys(dbDataMap);
	fieldLst.splice(fieldLst.indexOf('CONTACT_RELATED_LIST'), 1);
	fieldLst.splice(fieldLst.indexOf('id'), 1);
	fieldLst.push("attr_data");
	fieldLst.push("action_data");

	var attrDataMap = {};
	if (_.isValid(dbDataMap["attr_data"])) {
		attrDataMap = dbDataMap["attr_data"];
	}
	attrDataMap["staffid"] = _.toString(dataMap["attr_data.staffid"]);
	attrDataMap["card_code"] = _.toString(dataMap["attr_data.card_code"]);
	dbDataMap["attr_data"] = attrDataMap;

	var actionDataMap = {};
	if (_.isValid(dbDataMap["action_data"])) {
		actionDataMap = dbDataMap["action_data"];
	}

	if (_.fuzzyEqual(_.toNumber(this.uid()), 0)) {
		//新建
		actionDataMap["creator"] = APP.userName();
		actionDataMap["create_time"] = query.getNow();
		dbDataMap["action_data"] = actionDataMap;

		contactId = query.insertRow({
			table: "pub_contacts",
			data: dbDataMap,
			field: fieldLst,
			unique_field: "id",
			auto_increment_field: "id",

		});
		if (query.lastError().isValid()) {
			throw query.lastError().text();
		}
	} else {
		//编辑
		contactId = this.uid();
		actionDataMap["modify_oper"] = APP.userName();
		actionDataMap["modify_time"] = query.getNow();
		dbDataMap["action_data"] = actionDataMap;
		query.updateRow({
			table: "pub_contacts",
			data: dbDataMap,
			field: fieldLst,
			where: {
				"id": contactId
			},
			update_policy: {
				"attr_data": "json_merge",
				"action_data": "json_merge"
			}

		});
		if (query.lastError().isValid()) {
			throw query.lastError().text();
		}
	}

	query.deleteRow({
		table: "pub_contacts_lnk_related",
		where: {
			"contact_id": contactId
		}
	});
	if (query.lastError().isValid()) {
		throw query.lastError().text();
	}

	var roleInserter = new TSqlInserterV2;
	roleInserter.setTable("pub_contacts_lnk_related");
	roleInserter.setField(["related_id", "relation", "contact_id", "seq"]);
	var seq = 0;
	_.each(dataMap["CONTACT_RELATED_LIST"], function (relatedEle) {
		var insertMap = {};
		insertMap["contact_id"] = contactId;
		insertMap["related_id"] = _.toString(relatedEle["related_id"]);
		insertMap["relation"] = _.toString(relatedEle["relation"]);
		insertMap["seq"] = seq;
		seq++;
		roleInserter.setData(insertMap);
		query.insertRow(roleInserter);
		if (query.lastError().isValid()) {
			throw query.lastError().text();
		}
	});


	query.commit();
	this.unloading();
	// 刷新
	this.setUid(contactId);
	this.dataSaved(contactId);
	this.alertOk(this.ttr("Save data failed!"));

} catch (e) {
	this.unloading();
	query.rollback();
	TMessageBox.error(this, this.ttr('Save data failed!'), _.toString(e));
}

