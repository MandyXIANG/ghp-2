var self = this;

this.afterModuleInit = function () {
    var cfg = this.config();
    var sqlStr = "WITH TEMP1 AS (SELECT json_data->>'key' AS key, json_data->>'seq' AS seq \
        FROM (SELECT jsonb_array_elements(json_data) AS json_data FROM mes_workcenter_param WHERE param_name = 'mes_mobile_inspection' AND workcenter_id = '{0}') t \
        WHERE json_data->>'key' IS NOT NULL) SELECT QDC.*, TEMP1.seq FROM qc_defect_code AS QDC LEFT JOIN TEMP1 ON QDC.code = TEMP1.key WHERE QDC.code IN (TEMP1.key)";
    sqlStr = _.format(sqlStr, self.uid());
    _.set(cfg, "view.data_set.db_sql", sqlStr);
    this.setConfig(cfg);
}