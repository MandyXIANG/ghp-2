//计算wip_qty值
this.countWipQty = function (dataLst) {
	try {
		if (dataLst.length > 0) {
			_.forEach(dataLst, function (data) {
				var inputQty = _.toNumber(data["process_input_qty"]);
				var outQty = _.toNumber(data["output_qty"]);
				var diffQty = _.toNumber(data["diff_qty"]);
				var wipQty = inputQty + diffQty - outQty;
				data["wip_qty"] = _.toString(wipQty);
			})
		}
		return dataLst;
	}
	catch (e) {
		print("error:	" + e);
		return { "data": [], "err": e };
	}
}

this.getTransferedRightTableData = function (dataLst) {
    try {
		if (dataLst.length > 0) {
			_.forEach(dataLst, function (data) {
				if (data["ishighlight"] == "true") {
					data["bg_color"] = "#FFFF99";
				}
			})
		}
		return dataLst;
    }
    catch (e) {
        print("error:	" + e);
        return { "data": [], "err": e };
    }
}