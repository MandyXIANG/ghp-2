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
    // 获取主计划
    var mainPlanDataLst = query.selectArrayMap({
        table: "mes_main_plan",
        field_format: {
            attr_data: "json"
        }
    });
    if (query.lastError().isValid()) throw query.lastError().text();
    _.each(mainPlanDataLst, function(mainPlanData) {
        var productLine = _.result(mainPlanData, 'attr_data.product_line', '');
        if (! _.includes(workcenterCodeLst, productLine)) {
            // 获取对应生产版本的product_line
            var prodVersionData = _.find(prodVersionDataLst, {partnumber: mainPlanData.partnumber, prod_version: _.result(mainPlanData, 'attr_data.version', '')})
            var newProductLine = _.result(prodVersionData, 'attr_data.product_line', '');
            if (newProductLine != '') {
                // 更新主计划
                query.updateRow({
                    table: "mes_main_plan",
                    data: {
                        attr_data: {
                            product_line: newProductLine
                        }
                    },
                    where: {
                        id: mainPlanData.id
                    },
                    update_policy: {
                        attr_data: 'json_merge'
                    }
                });
                if (query.lastError().isValid()) throw query.lastError().text();

                // 更新生产工单
                query.updateRow({
                    table: "mes_prod_order",
                    data: {
                        attr_data: {
                            product_line: newProductLine
                        }
                    },
                    where: {
                        main_plan_id: mainPlanData.id
                    },
                    update_policy: {
                        attr_data: 'json_merge'
                    }
                })
                if (query.lastError().isValid()) throw query.lastError().text();
            }
        }
    })
    print("End");
}
catch(e) {
    print(e)
}