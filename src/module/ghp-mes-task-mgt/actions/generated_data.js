var self = this;
try {
    var query = new TSqlQueryV2(T_SQLCNT_POOL.getSqlDatabase());
    var planTitle = self.userData("plan_title");
    self.setUserData('plan_title', '');
    var orderId = query.selectValue({
        table: "mes_prod_order",
        field: "id",
        where: { prod_order_no: planTitle }
    })
    if (!_.isValid(orderId)) {
        return;
    }

    var processIdLst = query.selectArrayValue({
        table: "mes_prod_process",
        field: "id",
        value_field: "id",
        where: { prod_order_id: orderId }
    })
    if(_.isEmpty(processIdLst)) {
        return;
    }
    var param = {
        'prod_order_no': planTitle,
        'prod_process_id': processIdLst
     };
    var httpUrl = APP.httpUrl();
    httpUrl = _.trimRight(httpUrl, "ikm6");
    var scriptPath = "ghp/";
    var createUrl = httpUrl + scriptPath + 'ghp-create_stockout_request';
    var text1 = httpRequest(createUrl, param, "ghp-create_stockout_request");

    var updateUrl = httpUrl + scriptPath + 'ghp-update_request_material_qty';
    var text2 = httpRequest(updateUrl, param, "ghp-update_request_material_qty");
} catch (e) {
    print(e)
}


function httpRequest(url, param, apiName) {
    var xhr = new XMLHttpRequest;
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.open('POST', url, false);
    xhr.send(JSON.stringify(param));
    if (xhr.status == 200 && xhr.readyState == 4) {
        return xhr.responseText;
    } else {
        throw "_API_ERROR__SEP_" + apiName + "_SEP_" + _.toString(xhr.response);
    }
}