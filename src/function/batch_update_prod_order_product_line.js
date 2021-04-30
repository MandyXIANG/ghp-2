var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
try {
    // workcenter信息
    var workcenterCodeLst = query.selectArrayValue({
        table: "mes_workcenter",
        field: "code",
        where: {
            node_type: 'work_center'
        }
    });
    // 获取生产版本
    var prodVersionDataLst = query.selectArrayMap({
        table: "mes_material_prod_version",
        field_format: {
            attr_data: "json"
        }
    });
    if (query.lastError().isValid()) throw query.lastError().text();
    // 获取生产工单
    var prodOrderDataLst = query.selectArrayMap({
        table: "mes_prod_order",
        field_format: {
            attr_data: "json"
        }
    });
    if (query.lastError().isValid()) throw query.lastError().text();
    _.each(prodOrderDataLst, function(prodOrderData) {
        var productLine = _.result(prodOrderData, 'attr_data.product_line', '');
        if (! _.includes(workcenterCodeLst, productLine)) {
            // 获取对应生产版本的product_line
            var prodVersionData = _.find(prodVersionDataLst, {partnumber: prodOrderData.partnumber, prod_version: _.result(prodOrderData, 'attr_data.prod_version', '')})
            var newProductLine = _.result(prodVersionData, 'attr_data.product_line', '');
            if (newProductLine != '') {
                // 更新生产工单
                query.updateRow({
                    table: "mes_prod_order",
                    data: {
                        attr_data: {
                            product_line: newProductLine
                        }
                    },
                    where: {
                        id: prodOrderData.id
                    },
                    update_policy: {
                        attr_data: 'json_merge'
                    }
                });
                if (query.lastError().isValid()) throw query.lastError().text();
            }
        }
    })
    print("End");
}
catch(e) {
    print(e)
}