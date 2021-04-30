var self = this;

this.afterModuleInit = function () {
    const workcenterId = self.uid();
    var cfg = this.config();
    var db_filter = _.format("workcenter_id = {0} AND param_name = 'accessories_used_position'", workcenterId);
    _.set(cfg, 'view.data_set.db_filter', db_filter);
    this.setConfig(cfg);
}