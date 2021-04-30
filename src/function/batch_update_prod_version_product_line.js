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
    if (query.lastError().isValid()) throw query.lastError().text();
    // 工艺信息，用于获取某个process的父工艺代码
    var parentProcessMap = query.selectMapValue({
        table: "mes_traveller_process",
        field: "process_code, parent_process_code",
        value_field: "parent_process_code",
        unique_field: "process_code",
        where: "parent_process_code IS NOT NULL AND parent_process_code != ''"
    })
    if (query.lastError().isValid()) throw query.lastError().text();

    // 获取生产版本
    var prodVersionDataLst = query.selectArrayMap({
        table: "mes_material_prod_version",
        field_format: {
            attr_data: "json"
        }
    });
    if (query.lastError().isValid()) throw query.lastError().text();
    _.each(prodVersionDataLst, function(prodVersionData) {
        var productLine = _.result(prodVersionData, 'attr_data.product_line', '');
        if (! _.includes(workcenterCodeLst, productLine)) {
            // 获取对应的工艺路线第一站
            var firstProcessCode = query.selectValue({
                table: "mes_material_traveller_process",
                field: "process_code",
                where: {
                    traveller_id: prodVersionData.partnumber_traveller_id,
                    seq: 1
                }
            });
            if (query.lastError().isValid()) throw query.lastError().text();
            var newProductLine = _.result(parentProcessMap, firstProcessCode, '');
            if (newProductLine != '') {
                // 更新工艺路线
                query.updateRow({
                    table: "mes_material_prod_version",
                    data: {
                        attr_data: {
                            product_line: newProductLine
                        }
                    },
                    where: {
                        id: prodVersionData.id
                    },
                    update_policy: {
                        attr_data: 'json_merge'
                    }
                });
                if (query.lastError().isValid()) throw query.lastError().text();

                // 更新主计划
                query.updateRow({
                    table: "mes_main_plan",
                    data: {
                        attr_data: {
                            product_line: newProductLine
                        }
                    },
                    where: {
                        partnumber: prodVersionData.partnumber,
                        "attr_data#>>'{version}'": prodVersionData.prod_version
                    },
                    update_policy: {
                        attr_data: 'json_merge'
                    }
                })
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
                        partnumber: prodVersionData.partnumber,
                        "attr_data#>>'{prod_version}'": prodVersionData.prod_version
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