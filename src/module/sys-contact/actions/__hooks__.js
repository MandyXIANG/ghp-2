// uiloader加载数据前处理数据(标准产品中注释掉，项目配置需要时启用)
this.handleDetailData = function (iDataMap) {
    var data = iDataMap;
    if (_.has(data, "attr_data")) {
        data["attr_data.staffid"] = _.toString(data["attr_data"]["staffid"]);
        data["attr_data.card_code"] = _.toString(data["attr_data"]["card_code"]);
    }
    // TLogger.writeLog("data:	" + _.toString(data));
    return data;
}