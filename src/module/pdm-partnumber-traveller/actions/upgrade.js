var self = this;
var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
try {

    var versionId = this.userData("version_id");
    var sysVersion = this.userData("sys_version");
    var status = this.userData("status");
    var selectedJob = this.userData("selected_pn");
    var latestVersion = _.toNumber(selectedJob.sys_version);
    var lastetStatus = selectedJob.status;
    var partnumberId = selectedJob.id;
    var oldVersionId = selectedJob.version_id;
    while (latestVersion <= _.toNumber(sysVersion)){
		latestVersion++;
    }

    // 新的data_version
    query.begin();
    var oldDataVersion = query.selectMap({
        table: "mes_partnumber_data_version",
        field: "*",
        field_format:{'extra_data':'json'},
        where: [
            "partnumber_id = " + partnumberId,
            "status = " + "'released'",
            {'class': 'traveller'}
        ]
    })
    var newDataVersionId = query.insertRow({
        table: "mes_partnumber_data_version",
        data: {
            partnumber_id: partnumberId,
            'class': "traveller",
            sys_version: latestVersion,
            version: oldDataVersion["version"],
            extra_data: oldDataVersion["extra_data"],
            status: "draft"
        },
        unique_field: "id",
        auto_increment_field: "id"
    });
    query.updateRow({
        table: "mes_partnumber_data_version",
        data: {
            status: "scraped"
        },
        where: [
            "sys_version != " + latestVersion,
            "partnumber_id =" + partnumberId,
            {'class': 'traveller'}
        ]
    });

    // 复制旧数据
    var oldDataList = query.selectArrayMap({
        table: "mes_partnumber_traveller",
        field: "*",
        where: {data_version_id: versionId}
    });

    _.each(oldDataList, function(item){
        var oldProcessId = _.cloneDeep(item.id);
        delete item.id;
        item.data_version_id = newDataVersionId;
        // 插入process
        var newProcessId = query.insertRow({
            table: "mes_partnumber_traveller",
            data: item,
            unique_field: "id",
            auto_increment_field: "id"
        });
        query.updateRow({
            table: "mes_partnumber_traveller_bom",
            data: {process_id: newProcessId},
            where: {process_id: oldProcessId}
        });
    });

	var newPnData = {
		status: "draft"
	};

	if (latestVersion != _.toNumber(selectedJob.sys_version)){
		newPnData.sys_version = latestVersion;
	}
	query.updateRow({
		table: "mes_partnumber",
		data: newPnData,
		where: {id: partnumberId}
	});

	// Log
	query.insertRow({
		table: "mes_partnumber_log",
		data: {
			partnumber_id: partnumberId,
			sys_version: latestVersion,
			action_time: APP.getServerNow(),
			user_name: APP.userFullname() + "(" + APP.userName() + ")",
			user_id: APP.userId(),
			action_type: self.ttr("Version Upgraded"),
			site: APP.getSysHostAndIp(),
			remark: self.ttr("Traveller upgrade") + " " + sysVersion + " -> " + latestVersion,
			detail: self.ttr("Traveller upgrade") + " " + sysVersion + " -> " + latestVersion
		}
	});

	if (query.lastError().isValid()) throw query.lastError().text();

	query.commit();

    this.dataSaved("");
    this.refresh();
    this.alertOk(this.ttr("Data loaded"));
} catch(e) {
    query.rollback();
    GUI.msgbox({detail: e})
}

/*---ACTION---
ICON: "arrow-circle-o-up"
LABEL: "Upgrade"
LABEL_ZHCN: "版本升级"
LABEL_ZHTW: "版本升級"
ACCEL: ""
TOOLTIP: "Upgrade"
TOOLTIP_ZHCN: "版本升级"
TOOLTIP_ZHTW: "版本升級"
PERMISSION: "pdm-partnumber-traveller-upgrade"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "return this.userData('status') == 'released' ? 'show' : 'hide'"
---ACTION---*/