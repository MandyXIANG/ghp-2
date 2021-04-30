importPackage("moment");
importPackage("mes.core");

this.handleTableData = function (tableDataList) {
    try {
        _.forEach(tableDataList, function(data) {
            data["attr_data.progress_percent"] = 0;
            var inputQty = _.toNumber(data["input_qty"]);
            var outputQty = _.toNumber(data["output_qty"]);
            data["attr_data.progress_percent"] = outputQty/inputQty * 100;
            if (data['attr_data.progress_percent'] > 100) {
                data['attr_data.progress_percent'] = 100;
            }
        });
        return tableDataList;
    } catch (e) {
        print(e);
        return tableDataList;
    }
}