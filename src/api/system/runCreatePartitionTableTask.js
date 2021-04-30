var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture('DBNAME');
var Err = require('topsin.error');
var DB  = require('topsin.database');
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var os = require('os');
var Moment = require('moment');

try {
    //检查PG版本
    var pg_ver = DB.query(DBNAME, function(query){
        var sql = "select (select regexp_matches((select version()), '(\\\d+\\\.\\\d+)'))[1]";
        var ver = query.selectValue(sql,{},{});
        if(query.lastError().isValid()) {
            throw query.lastError().text();
        }
        return ver;
    });
    if (pg_ver < 10.1) throw "pg database version should be >= 10.1; current version is " + pg_ver;

    //获取任务列表
    var tasklist = DB.query(DBNAME, function(query){
        var ret = query.selectArrayMap({
            table:'sys_partition_task',
            field:["id","name","table_name","create_time","partition_data"],
            where:{status:"active"},
            field_format:{partition_data:"json"},
        });
        if (query.lastError().isValid()) {
            throw query.lastError().text();
        }
        return ret;
    });
    
    var res_list = [];
    _.forEach(tasklist, function(task) {
        var id = _.get(task, 'id', -1);
        var table_name = _.get(task, 'table_name', '');
        var partition_data = _.get(task, 'partition_data', {});
        var executor = new PartitionSqlBuilder(table_name, partition_data);
        var tmp = executor.execCreatePartitionTable();
        res_list = _.concat(res_list, tmp);
        
        var now = os.getNow();
        if (!_.isEmpty(id) && id !== -1) {
            var sql = "UPDATE sys_partition_task SET create_time = '" + now + "', " +
            "action_data = '{\"last_execute_time\": \"" + now + "\"}', " +
            "log_data = concat(log_data, '" + JSON.stringify(tmp, 'null') + ",') WHERE id = " + id;
            var r = DB.query(DBNAME, function(query){
                query.execSql(sql);
                return query.lastError().text();
            });
            if (!_.isEmpty(r)) throw r;
        }


    });

    result.setData(res_list);
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}

function PartitionSqlBuilder(table, partition) {
    var parent_table = table;
    var table_name = _.get(partition, "table_name", "");
    var column_name = _.get(partition, "column_name", "");
    var partition_type = _.get(partition, "partition_type", "");
    var values = _.get(partition, "values", []);
    var from_time = _.get(partition, "from_time", "");
    var to_time = _.get(partition, "to_time", "");
    var before_count = _.toInteger(_.get(partition, "before_count", -1));
    var forecast_count = _.toInteger(_.get(partition, "forecase_count", -1));
    if (forecast_count === -1) {
        forecast_count = _.toInteger(_.get(partition, "forcast_count", -1));
    }
    var child_map = {};
    var child_partition_column_name = "";
    var child_partition_partition_type = "";
    var indices = [];
    var res = [];
    if (_.has(partition, "child")) {
        child_map = _.get(partition, "child", {});
        child_partition_column_name = _.get(child_map, "column_name", "");
        child_partition_partition_type = _.get(child_map, "partition_type", "");
    }
    else {
        indices = _.get(partition, "indices", []);
    }

    function checkParam() {
        if (_.isEmpty(table_name)) {
            return "table name can not be null!";
        }
        if (_.isEmpty(column_name)) {
            return "column name can not be null!";
        }
        if (_.isEmpty(partition_type)) {
            return "partition type can not be null!";
        }

        if (partition_type == "VALUE") {
            if (values.length == 0) {
                return "partition type is 'VALUE', values can not be empty!"
            }
        }
        else {
            if (_.isEmpty(from_time)) {
                return "from_time can not be null!";
            }
            if (_.isEmpty(to_time)) {
                return "to_time can not be null!";
            }
            if (forecast_count == -1) {
                forecast_count = 10;
            }
            if (before_count == -1) {
                before_count == 1
            }
        }
        return "";
    }

    function checkTableExists(name) {
        var r = DB.query(DBNAME, function(query){
            return query.selectValue("select to_regclass('" + name + "') is not null",{},{});
        });
        r = _.toString(r);
        if (r == "true" || r == "t") {
            res.push({
                log_level:"INFO",
                action_time:os.getNow(),
                category:"TABLE_ALREADY_EXIST",
                detail: "Table [" + name + "] already exist!"
            });
            return true;
        }
        return false;
    }

    function createIndex(table) {
        if (_.isEmpty(child_map)) {
            if (_.isEmpty(indices)) return;
            var i = 0;
            for (var j = 0; j < indices.length; ++j) {
                var idx = indices[j];
                var type = _.get(idx, "type", "index");
                var index_type = (_.toString(type).toUpperCase() == "UNIQUE_INDEX") ? "UNIQUE INDEX" : "INDEX";
                var method = _.get(idx, "method", "btree");
                var columns = _.get(idx, "columns", []);
                var idx_sql = _.formatUnicorn(
                    "CREATE ${a} \"${b}_partition_idx${c}\" ON \"public\".\"${b}\" USING ${d} (${e})",
                    {a:index_type, b:table, c:i, d:method, e:_.join(columns, ',')}
                );

                if (executeSql(idx_sql, "CREATE_INDEX_ERROR")) {
                    res.push({
                        log_level:"INFO",
                        action_time: os.getNow(),
                        category:"CREATE_INDEX_SUCCESS",
                        detail: _.formatUnicorn("create ${a} ${b}_index${c} on ${d}",{a:type, b:i, c:table, d:table}),
                    });
                }
                ++i;
            }
        }
    }

    function executeSql(sql, err_category) {
       var tmp = DB.query(DBNAME, function(query){
            query.execSql(sql);
            if (query.lastError().isValid()) {
                res.push({
                    log_level:"ERROR",
                    action_time: os.getNow(),
                    category: err_category,
                    detail: "Sql:(" + sql + ") execute error." + query.lastError().text(),
                });
                return false;
            }
            return true;
       });
       return tmp;
    }

    function getMonthList(from, to) {
        var tmp = [];
        
    }

    function getDataRangeValues() {
        var from_date =  Moment();
        if ("NOW" !== from_time) {
            from_date = Moment(from_time);
        }

        var to_date = Moment();
        if ("NOW" !== to_time) {
            to_date = Moment(to_time);
        }

        if (partition_type.search("M") != -1) {
            to_date.add(forecast_count, 'M');
            from_date.add(-before_count, 'M');
        }
        else {
            to_date.add(forecast_count, 'y');
            from_date.add(-before_count, 'y');
        }
        var ranges = [];
        if (partition_type == "YYMMID") {
            while (from_date.diff(to_date, 'M') <= 0) {
                ranges.push([
                    from_date.format("YYYYMM"),
                    from_date.format('YYMM') + '00000000000000',
                    from_date.add(1, 'M').format('YYMM') + '00000000000000',
                ]);
            }
        }
        else if (partition_type == "YYID") {
            while (from_date.diff(to_date, 'years') <= 0) {
                ranges.push([
                    from_date.format("YYYY"),
                    from_date.format('YY') + '0000000000000000',
                    from_date.add(1,'y').format('YY') + '0000000000000000',
                ]);
            }
        }
        else if (partition_type.search('M') != -1) {
            while (from_date.diff(to_date, 'M') <= 0) {
                ranges.push([
                    from_date.format(partition_type),
                    from_date.format('YYYY-MM-01 00:00:00'),
                    from_date.add(1,'M').format('YYYY-MM-01 00:00:00'),
                ]);
            }
        }
        else {
            while (from_date.diff(to_date, 'years') <= 0) {
                ranges.push([
                    from_date.format(partition_type),
                    from_date.format('YYYY-01-01 00:00:00'),
                    from_date.add(1,'y').format('YYYY-01-01 00:00:00'),
                ]);
            }
        }
        return ranges;
    }

    this.execCreatePartitionTable = function() {
        var err = checkParam();
        if (!_.isEmpty(err)) {
            res.push({
                log_level:"ERROR",
                action_time: os.getNow(),
                category:"PARAMETER_ERROR",
                detail:err,
            });
            return res;
        }

        var sql = "CREATE TABLE public.${partition} PARTITION OF public." + parent_table;
        var next_partiton_sql = "";
        if (!_.isEmpty(child_partition_partition_type)) {
            if ("VALUE" == child_partition_partition_type) {
                next_partiton_sql += " PARTITION BY LIST(" + child_partition_column_name + ")";
            }
            else {
                next_partiton_sql += " PARTITION BY RANGE(" + child_partition_column_name + ")";
            }
        }
        var oidsSql = " WITH(oids = false)";

        var partition_table_name = "";
        if (partition_type == "VALUE") {
            for (var v = 0; v < values.length; ++v) {
                var value = _.toString(values[v]);
                var new_sql = sql;
                partition_table_name = _.formatUnicorn(table_name, {parent_table:parent_table,value:value} )
                if (!checkTableExists(partition_table_name)) {
                    new_sql = _.formatUnicorn(new_sql, {partition:partition_table_name});
                    new_sql += " FOR VALUES IN ('" + value + "')";
                    new_sql += (next_partiton_sql + oidsSql);
                    if (!executeSql(new_sql, "CREATE_PARTITON_TABLE_ERROR")) {
                        continue;
                    }
                    res.push({
                        log_level:"INFO",
                        action_time:os.getNow(),
                        cateogry:"CREATE_PARTITON_TABLE_SUCCESS",
                        detail: "create table " + partition_table_name + " success!",
                    });
                }

                if (!_.isEmpty(child_map)) {
                    var sub_routine = new PartitionSqlBuilder(partition_table_name, child_map);
                    res = _.concat(res, sub_routine.execCreatePartitionTable());
                }
                else {
                    createIndex(partition_table_name);
                }
            }
        }
        else {
            var range_values = getDataRangeValues();
            for (var i = 0; i < range_values.length; ++i) {
                var new_sql = sql;
                var range = range_values[i];
                partition_table_name = _.formatUnicorn(table_name, {parent_table:parent_table,value:range[0]} )
                if (!checkTableExists(partition_table_name)) {
                    new_sql = _.formatUnicorn(new_sql, {partition:partition_table_name});
                    new_sql += " FOR VALUES FROM('" + range[1] + "') TO ('" + range[2] + "')";
                    new_sql += (next_partiton_sql + oidsSql);
                    if (!executeSql(new_sql, "CREATE_PARTITON_TABLE_ERROR")) {
                        continue;
                    }
                    res.push({
                        log_level: "INFO",
                        action_time:os.getNow(),
                        cateogry:"CREATE_PARTITON_TABLE_SUCCESS",
                        detail: "create table " + partition_table_name + " success!",
                    })
                    if (!_.isEmpty(child_map)) {
                        var sub_routine = new PartitionSqlBuilder(partiton_table_name, child_map);
                        res = _.concat(res, sub_routine.execCreatePartitionTable());
                    }
                    else {
                        createIndex(partition_table_name);
                    }
                }
            }
        }
        return res;
    }
    
}