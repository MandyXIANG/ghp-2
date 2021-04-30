#include "ghpmesaccessoriesusedthread.h"
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tdataparse.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <topcore/topcore.h>
#include <tbaseutil/thttputil.h>
#include <tbaseutil/tjsonapi.h>

GhpMesAccessoriesusedThread::GhpMesAccessoriesusedThread(QObject *iParent)
    : TopClassThreadAbs(iParent)
{

}

GhpMesAccessoriesusedThread::~GhpMesAccessoriesusedThread()
{

}

void GhpMesAccessoriesusedThread::run()
{
    if (invokeName() == "GET_DATA") {
        getData(invokeParameter().toMap());
    }else if(invokeName() == "EDIT_DATA"){
        editData(invokeParameter().toMap());
    }else if(invokeName() == "SAVE_DATA"){
        saveData(invokeParameter().toMap());
    }else if(invokeName() == "SAVE_TOOL"){
        saveTool(invokeParameter().toMap());
    }else if(invokeName() == "OBSOLETE_ITEM"){
        obsoleteItem(invokeParameter().toMap());
    }else if(invokeName() == "POSTPONE_ALARM"){
        postponeAlarm(invokeParameter().toMap());
    }else if(invokeName() == "EXE_CAL_DATA"){
        exeCallData(invokeParameter().toMap());
    }

}

void GhpMesAccessoriesusedThread::getData(const QVariantMap &iParamMap)
{
    Q_UNUSED(iParamMap)
    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QVariantMap resMap;
        TSqlSelectorV2 selector;
        selector.setTable("mes_prod_process_yield");
        selector.setField(QStringList() << "id" << "partnumber" << "process_code");
        selector.setWhere("start_time is not null");
        selector.addWhere("end_time is null");
        selector.setReturnRowCount(true);

        QVariantList yeildList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        //归总process_code
        QStringList processCodes;
        QStringList pns;
        QVariantMap codeDataMap;
        foreach (QVariant value, yeildList) {
            QVariantMap tmpMap = value.toMap();
            QString code = tmpMap["process_code"].toString();
            QString partnumber = tmpMap["partnumber"].toString();
            if(!processCodes.contains(code)){
                processCodes.append(code);
            }
            if(!pns.contains(partnumber)){
                pns.append(partnumber);
            }
            codeDataMap[code] = tmpMap;
        }

        QVariantList workcenterList;
        if(processCodes.count() != 0){
            selector.clear();
            selector.setTable("mes_workcenter");
            selector.setField(QStringList() << "id" << "code" << "process_code_list" << "extra_data->>'workcenter_category' AS workcenter_category");
            selector.setWhere("process_code_list",processCodes,"&&");
            selector.setFieldFormat("process_code_list","array");
            workcenterList = sqlQuery.selectArrayMap(selector);

            if (sqlQuery.lastError().isValid()) {
                throw sqlQuery.lastError();
            }
        }

        QStringList workcenterIds;
        foreach (QVariant value, workcenterList) {
            QVariantMap tmpMap = value.toMap();
            QString id = tmpMap["id"].toString();
            workcenterIds.append(id);
        }

        QString tmpWhereStr = workcenterIds.join("','");
        tmpWhereStr.push_front("'");
        tmpWhereStr.push_back("'");

        //递归查询出上级
        QString sqlStr = QString("WITH RECURSIVE workcenter AS ( "
                                 "(SELECT id,parent_id,code,name,description,node_type,process_code_list "
                                 "FROM mes_workcenter WHERE id in (%1)) "
                                 "UNION "
                                 "(SELECT mes.id ,mes.parent_id,mes.code,mes.name,mes.description,mes.node_type,mes.process_code_list "
                                 "FROM mes_workcenter AS mes, workcenter "
                                 "WHERE mes.id = workcenter.parent_id "
                                 " ) ) "
                                 "SELECT id,code,name,description,node_type,process_code_list,parent_id FROM workcenter ORDER BY id").arg(tmpWhereStr);


        workcenterList = sqlQuery.selectArrayMap(sqlStr,{});

        //递归查询部分不能够json   需要补workcenter_category数据
        selector.clear();
        selector.setTable("mes_workcenter");
        selector.setField(QStringList() << "id" << "code" << "name" << "description" << "node_type" << "parent_id" << "extra_data"
                          << "extra_data->>'machine_code' AS machine_code" << "extra_data->>'workcenter_category_info' AS workcenter_category_info");
        selector.setWhere("id",workcenterIds);
        selector.setFieldFormat("extra_data","json");
        selector.setUniqueField("code");
        QVariantMap workcenterMap = sqlQuery.selectMapMap(selector);

        foreach (QVariant value, workcenterList) {
            QVariantMap tmpMap = value.toMap();
            QString code = tmpMap["code"].toString();
            QVariantMap infoMap = workcenterMap[code].toMap();
            tmpMap["workcenter_category_info"] = infoMap["workcenter_category_info"].toString();
            workcenterList.replace(workcenterList.indexOf(value),tmpMap);
        }


        //查下一级
        selector.clear();
        selector.setTable("mes_workcenter");
        selector.setField(QStringList() << "id" << "code" << "name" << "description" << "node_type" << "parent_id" << "extra_data"
                          << "extra_data->>'machine_code' AS machine_code" << "extra_data->>'workcenter_category_info' AS workcenter_category_info");
        selector.setWhere("parent_id",workcenterIds);
        selector.setFieldFormat("extra_data","json");
        QVariantList lineList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        //归总使用到的machine_code，后续dnc查找的where
        QStringList usedMachCodes;
        foreach (QVariant value, lineList) {
            QVariantMap tmpMap = value.toMap();
            QString code = tmpMap["machine_code"].toString();
            if(!usedMachCodes.contains(code)){
                usedMachCodes.append(code);
            }
        }

        /*
        cutter_position varchar(255) NULL, -- 刀具位置
        cutter_mnemonic varchar(255) NULL, -- 刀片助记码
        cutter_model varchar(255) NULL, -- 刀片型号
        cutter_sec varchar(255) NULL, -- 刀片寿命
        control_size varchar(255) NULL, -- 控制尺寸
        change_inspect_size varchar(255) NULL, -- 换刀后检验尺寸
        over_length varchar(255) NULL, -- 伸出长度
        extend_over_length varchar(255) NULL, -- 延长杆伸出长度
        hilt_mnemonic varchar(255) NULL, -- 刀柄助记码
        hilt_model varchar(255) NULL, -- 刀柄型号
        hilt_binding_length varchar(255) NULL, -- 刀柄绑刀长度
        pole_mnemonic varchar(255) NULL, -- 刀杆助记码
        pole_model varchar(255) NULL, -- 刀杆型号
        pole_binding_length varchar(255) NULL, -- 刀杆绑刀长度
        outer_mnemonic varchar(255) NULL, -- 其他类型助记码
        outer_model varchar(255) NULL, -- 其他类型型号
        */

        //道具表workcenterIds全部工作中心的id，pns生产表yield下对应刀具的map_number
        selector.clear();
        selector.setTable("mes_prod_tooling_param AS A LEFT JOIN mes_prod_tooling_param_bom AS B ON A.id = B.tooling_param_id");
        selector.setField(QStringList() << "A.op_no" << "A.op_name" << "A.workcenter_code" << "A.workcenter_name" << "A.map_number" << "A.id AS tooling_param_id"
                          << "B.cutter_position" << "B.cutter_mnemonic" << "B.cutter_model"
                          << "B.cutter_sec" << "B.control_size" << "B.change_inspect_size" << "B.over_length" << "B.extend_over_length"
                          << "B.hilt_mnemonic" << "B.hilt_model" << "B.hilt_binding_length" << "B.pole_mnemonic" << "B.pole_model"
                          << "B.pole_binding_length" << "B.outer_mnemonic" << "B.outer_model"
                          << "B.repair_cutter_mnemonic" << "B.repair_cutter_model" << "B.repair_cutter_sec");
        selector.setWhere("A.workcenter_id",workcenterIds);
        selector.addWhere("A.map_number",pns);

        QVariantList toolList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        //归总出全部的  助记码
        QStringList helpCodes;
        foreach (QVariant value, toolList) {
            QVariantMap tmpMap = value.toMap();
            QString cutter_mnemonic = tmpMap["cutter_mnemonic"].toString();
            QString repair_cutter_mnemonic = tmpMap["repair_cutter_mnemonic"].toString();

            if(!helpCodes.contains(cutter_mnemonic)){
                helpCodes.append(cutter_mnemonic);
            }

            if(!helpCodes.contains(repair_cutter_mnemonic)){
                helpCodes.append(repair_cutter_mnemonic);
            }
        }

        //得到onLine信息
        selector.clear();
        selector.setTable("mes_dnc_tooling_online");
        selector.setField(QStringList() << "id" << "machine_code" << "set_life"
                          << "current_life" << "alarm_life");
        selector.setUniqueField("machine_code");

        QVariantMap toolOnLineMap = sqlQuery.selectMapMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        //tmp
        selector.clear();
        selector.setTable("mes_dnc_tooling_online");
        selector.setField(QStringList() << "id" << "machine_code" << "set_life"
                          << "current_life" << "alarm_life" << "cutter_position" << "attr_data->>'serial_no' AS serial_no");
        selector.setWhere("machine_code",usedMachCodes);

        QVariantList toolOnLineList = sqlQuery.selectArrayMap(selector);

        QVariantMap calToolOnLineMap;
        foreach (QVariant value, toolOnLineList) {
            QVariantMap tmpMap = value.toMap();
            QString code = tmpMap["machine_code"].toString();
            QVariantList tmpList = calToolOnLineMap[code].toList();
            tmpList.append(tmpMap);
            calToolOnLineMap[code] = tmpList;
        }

        //归总工艺信息
        selector.clear();
        selector.setTable("pdm_parts");
        selector.setField(QStringList() << "id" << "pn");
        selector.setWhere("pn",pns);
        selector.addWhere("status","released");
        QVariantList pnIdsMapList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        QStringList pnIds;
        QVariantMap idPnMap;
        foreach (QVariant value, pnIdsMapList) {
            QVariantMap tmpMap = value.toMap();
            QString id = tmpMap["id"].toString();
            QString pn = tmpMap["pn"].toString();
            pnIds.append(id);
            idPnMap[id] = pn;
        }


        selector.clear();
        selector.setTable("pdm_parts_traveller_version AS A LEFT JOIN pdm_parts_traveller AS B ON A.id = B.traveller_version_id "
                          "LEFT JOIN pdm_parts_traveller_bom AS C ON B.id = C.traveller_id");
        selector.setField(QStringList() << "A.parts_id" << "C.json_data");
        selector.setWhere("A.parts_id",pnIds);
        selector.addWhere("A.status","released");
        selector.setFieldFormat("json_data","json");
        selector.setUniqueField("parts_id");

        QVariantMap tmpTravlMap = sqlQuery.selectMapMap(selector);
        //转map
        QVariantMap travlMap;
        foreach (QString partsId, tmpTravlMap.keys()) {
            QString pn = idPnMap[partsId].toString();

            travlMap[pn] = tmpTravlMap[partsId].toMap();
        }

        //从erp得到库存数据
        QVariantMap invCodeMap = getErpToolInfo(QVariantMap{{"help_code",helpCodes}});

        resMap["tool_list"] = toolList;
        resMap["line_list"] = lineList;
        resMap["workcenter_list"] = workcenterList;
        resMap["prod_list"] = yeildList;
        //resMap["on_line_map"] = toolOnLineMap;
        resMap["cal_on_line_map"] = calToolOnLineMap;
        resMap["traveller_info"] = travlMap;
        resMap["inv_info"] = invCodeMap;

        dataRes.setData(resMap);
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesAccessoriesusedThread::editData(const QVariantMap &iParamMap)
{
    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString personStr = iParamMap["prepare_person"].toString();
        QString timeStr = iParamMap["prepare_time"].toString();
        QString statusStr = iParamMap["prepare_status"].toString();

        QVariantMap dbMap;
        dbMap["prepare_person"] = personStr;
        dbMap["prepare_time"] = timeStr;
        dbMap["prepare_status"] = statusStr;
        TSqlUpdaterV2 updater;
        updater.setTable("mes_prod_tooling_online");
        updater.setData(dbMap);
        updater.setWhere("id",iParamMap["id"]);

        int id = sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        dataRes.setData(id);
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

QVariantMap GhpMesAccessoriesusedThread::getErpToolInfo(const QVariantMap &iParamMap)
{
    QVariantMap resMap;
    TDataResponse dataRes;

    //该配置需要作为参数参入，在模块中配置
    QVariantMap connectMap;
    connectMap["database_host"] = "192.168.5.30";
    connectMap["database_type"] = "QODBC";
    connectMap["database_name"] = "WUXIBEST";
    connectMap["database_user"] = "spumes";
    connectMap["database_pwd"] = "best1234";
    T_SQLCNT_POOL->setConnectParameter(connectMap,"erp");
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase("erp"));
    sqlQuery.begin();
    try {
        QStringList helpCodes = iParamMap["help_code"].toStringList();//助记码
        QString whereStr = helpCodes.join("','");
        QString sqlStr = QString("SELECT "
                                 "t2.FHelpCode,"
                                 "t2.FNumber,"
                                 "t2.FModel,"
                                 "t2.FName,"
                                 "t1.FQty,"
                                 "t3.FNumber "
                                 "FROM "
                                 "ICInventory t1 "
                                 "LEFT JOIN t_ICItem t2 ON t1.FItemID = t2.FItemID "
                                 "LEFT JOIN t_StockPlace t3 ON t1.FStockPlaceID = t3.FSPID "
                                 "WHERE "
                                 "t1.FStockID = 60710 AND t3.FNumber LIKE '%#%' "
                                 "AND "
                                 "t2.FHelpCode in('%1')").arg(whereStr);


        QVariantList infoList = sqlQuery.selectArrayMap(sqlStr,QVariantMap());

        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        //按助记码归总  实仓-刀柜
        QVariantMap arkInvMap;
        foreach (QVariant value, infoList) {
            QVariantMap tmpMap = value.toMap();
            QString FHelpCode = tmpMap["FHelpCode"].toString();
            QVariantList tmpList = arkInvMap[FHelpCode].toList();
            tmpList.append(tmpMap);
            arkInvMap[FHelpCode] = tmpList;
        }

        //虚仓-刀柜
        sqlStr = QString("SELECT "
                         "t2.FHelpCode,"
                         "t2.FNumber,"
                         "t2.FModel,"
                         "t2.FName,"
                         "t1.FQty,"
                         "t3.FNumber "
                         "FROM "
                         "POInventory t1 "
                         "LEFT JOIN t_ICItem t2 ON t1.FItemID = t2.FItemID "
                         "LEFT JOIN t_StockPlace t3 ON t1.FStockPlaceID = t3.FSPID "
                         "WHERE "
                         "t1.FStockID = 60710 AND t3.FNumber LIKE '%#%' "
                         "AND "
                         "t2.FHelpCode in('%1')").arg(whereStr);

        infoList = sqlQuery.selectArrayMap(sqlStr,QVariantMap());
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        foreach (QVariant value, infoList) {
            QVariantMap tmpMap = value.toMap();
            QString FHelpCode = tmpMap["FHelpCode"].toString();
            QVariantList tmpList = arkInvMap[FHelpCode].toList();
            tmpList.append(tmpMap);
            arkInvMap[FHelpCode] = tmpList;
        }

        resMap["ark_inv"] = arkInvMap;//刀柜库存

        //刀架-实仓
        arkInvMap.clear();
        sqlStr = QString("SELECT "
                         "t2.FHelpCode,"
                         "t2.FNumber,"
                         "t2.FModel,"
                         "t2.FName,"
                         "t1.FQty,"
                         "t3.FNumber "
                         "FROM "
                         "ICInventory t1 "
                         "LEFT JOIN t_ICItem t2 ON t1.FItemID = t2.FItemID "
                         "LEFT JOIN t_StockPlace t3 ON t1.FStockPlaceID = t3.FSPID "
                         "WHERE "
                         "t1.FStockID = 60710 AND t3.FNumber NOT LIKE '%#%' "
                         "AND "
                         "t2.FHelpCode in('%1')").arg(whereStr);


        infoList = sqlQuery.selectArrayMap(sqlStr,QVariantMap());

        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        foreach (QVariant value, infoList) {
            QVariantMap tmpMap = value.toMap();
            QString FHelpCode = tmpMap["FHelpCode"].toString();
            QVariantList tmpList = arkInvMap[FHelpCode].toList();
            tmpList.append(tmpMap);
            arkInvMap[FHelpCode] = tmpList;
        }

        //刀架-虚仓
        sqlStr = QString("SELECT "
                         "t2.FHelpCode,"
                         "t2.FNumber,"
                         "t2.FModel,"
                         "t2.FName,"
                         "t1.FQty,"
                         "t3.FNumber "
                         "FROM "
                         "POInventory t1 "
                         "LEFT JOIN t_ICItem t2 ON t1.FItemID = t2.FItemID "
                         "LEFT JOIN t_StockPlace t3 ON t1.FStockPlaceID = t3.FSPID "
                         "WHERE "
                         "t1.FStockID = 60710 AND t3.FNumber NOT LIKE '%#%' "
                         "AND "
                         "t2.FHelpCode in('%1')").arg(whereStr);

        infoList = sqlQuery.selectArrayMap(sqlStr,QVariantMap());
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        foreach (QVariant value, infoList) {
            QVariantMap tmpMap = value.toMap();
            QString FHelpCode = tmpMap["FHelpCode"].toString();
            QVariantList tmpList = arkInvMap[FHelpCode].toList();
            tmpList.append(tmpMap);
            arkInvMap[FHelpCode] = tmpList;
        }

        resMap["rest_inv"] = arkInvMap;

        dataRes.setData(resMap);
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return resMap;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
    return resMap;
}

void GhpMesAccessoriesusedThread::saveData(const QVariantMap &iParamMap)
{
    qDebug().noquote() << "iParamMap:       " << TDataParse::variant2JsonStr(iParamMap);
    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QStringList ids;
        //1.先查数据库全部数据（该库数据是有极限值的，约5000）
        TSqlSelectorV2 selector;
        selector.setTable("mes_prod_tooling_online");
        selector.setField("*");
        QVariantMap formatMap;
        formatMap["workcenter_data"] = "json";
        formatMap["attr_data"] = "json";
        selector.setFieldFormat(formatMap);
        QVariantList dbList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            qDebug().noquote() << "error_text:  " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }
        //qDebug().noquote() << "dbList:      " << TDataParse::variant2JsonStr(dbList);
        //按唯一键归总
        QVariantMap dbInfoMap;
        if(dbList.count() != 0){
            foreach (QVariant value, dbList) {
                QVariantMap tmpMap = value.toMap();
                QString id = tmpMap["id"].toString();
                if(!ids.contains(id)){
                    ids.append(id);
                }
                QString workcenter_code = tmpMap["workcenter_code"].toString();
                QString partnumber = tmpMap["partnumber"].toString();
                QString machine_code = tmpMap["machine_code"].toString();
                QString op_name = tmpMap["op_name"].toString();
                QString cutter_position = tmpMap["cutter_position"].toString();

                QString op_no = tmpMap["op_no"].toString();//2019-05-08fly新增唯一键

                QString keyStr = workcenter_code + partnumber + machine_code + op_name + cutter_position + op_no;
                dbInfoMap[keyStr] = tmpMap;
            }
        }

        //查出备刀信息，如果有的话
        QVariantMap prepareMap;//按online的id归总
        if(ids.count() != 0){
            //处理备刀表数据
            /*
            QString whereStr = ids.join("','");
            whereStr.push_front("'");
            QString sqlStr = QString("with grp as "
                                     "( "
                                       "select tooling_online_id, max(prepare_time) as prepare_time "
                                       "from mes_prod_tooling_prepare "
                                       "group by tooling_online_id "
                                     ") "
                                     "select a.id,a.tooling_online_id,a.prepare_time,a.prepare_person,a.prepare_type,"
                                     "a.cur_cutter_sec,a.cur_prepare_time,a.cur_prepare_person,a.cur_cutter_type from grp "
                                     "inner join mes_prod_tooling_prepare as a on grp.tooling_online_id = a.tooling_online_id "
                                     "and grp.prepare_time = a.prepare_time where a.tooling_online_id in (%1)").arg(whereStr);
            QVariantList prepareList = sqlQuery.selectArrayMap(sqlStr,QVariantMap());
            */
            TSqlSelectorV2 selector;
            selector.setTable("mes_prod_tooling_prepare");
            selector.setField(QStringList() << "id" << "tooling_online_id" << "prepare_time" << "prepare_person" << "prepare_type");
            selector.setWhere("tooling_online_id",ids);
            selector.addWhere("loaded_status","no");
            QVariantList prepareList = sqlQuery.selectArrayMap(selector);

            foreach (QVariant value, prepareList) {
                QVariantMap tmpMap = value.toMap();
                QString toolingId = tmpMap["tooling_online_id"].toString();
                prepareMap[toolingId] = tmpMap;
            }
        }

        //replaceRow  循环
        /*iParamMap["data"].toList()为实际的组合数据,即当前数据
         * dbInfoMap为onLine表数据，解释为：上一次的数据
         * */
        foreach (QVariant value, iParamMap["data"].toList()) {
            QVariantMap tmpMap = value.toMap();
            QVariantMap rowMap;

            QString workcenter_code = tmpMap["workcenter_code"].toString();
            QString partnumber = tmpMap["partnumber"].toString();
            QString machine_code = tmpMap["machine_code"].toString();
            QString op_name = tmpMap["op_name"].toString();
            QString cutter_position = tmpMap["cutter_position"].toString();
            QString op_no = tmpMap["op_no"].toString();//2019-05-08fly新增唯一键
            QString keyStr = workcenter_code + partnumber + machine_code + op_name + cutter_position + op_no;

            QVariantMap existedMap = dbInfoMap[keyStr].toMap();

            rowMap["workcenter_id"] = tmpMap["id"];
            rowMap["workcenter_code"] = tmpMap["workcenter_code"];
            rowMap["workcenter_name"] = tmpMap["workcenter_name"];
            QVariantMap workMap;
            workMap["group"] = tmpMap["group"];
            workMap["company"] = tmpMap["company"];
            workMap["plant"] = tmpMap["plant"];
            workMap["workshop"] = tmpMap["workshop"];
            workMap["workcenter_category_info"] = tmpMap["workcenter_category_info"];
            workMap["machine_factory"] = tmpMap["machine_factory"];
            workMap["machine_type"] = tmpMap["machine_type"];
            workMap["map_number"] = tmpMap["map_number"];
            workMap["dnc_life"] = tmpMap["dnc_life"];
            workMap["tooling_param_id"] = tmpMap["tooling_param_id"];
            rowMap["workcenter_data"] = workMap;
            rowMap["partnumber"] = tmpMap["partnumber"];
            rowMap["machine_code"] = tmpMap["machine_code"];
            rowMap["machine_name"] = tmpMap["machine_name"];

            rowMap["op_no"] = tmpMap["op_no"];
            rowMap["op_name"] = tmpMap["op_name"];
            rowMap["cutter_position"] = tmpMap["cutter_position"];
            rowMap["cutter_mnemonic"] = tmpMap["cutter_mnemonic"];
            rowMap["cutter_model"] = tmpMap["cutter_model"];
            rowMap["hilt_mnemonic"] = tmpMap["hilt_mnemonic"];
            rowMap["hilt_model"] = tmpMap["hilt_model"];
            rowMap["hilt_binding_length"] = tmpMap["hilt_binding_length"];
            rowMap["pole_mnemonic"] = tmpMap["pole_mnemonic"];
            rowMap["pole_model"] = tmpMap["pole_model"];
            rowMap["pole_binding_length"] = tmpMap["pole_binding_length"];
            rowMap["set_life"] = tmpMap["dnc_life"].toFloat();
            rowMap["current_life"] = tmpMap["current_life"].toFloat();
            rowMap["alarm_life"] = tmpMap["alarm_life"].toFloat();
            rowMap["priority"] = tmpMap["priority"].toString();
            rowMap["takt_time"] = tmpMap["takt_time"];
            rowMap["remaining_time"] = tmpMap["remaining_time"].toInt();
            rowMap["normal_shelves_count"] = tmpMap["normal_shelves_count"];
            rowMap["normal_cabinet_count"] = tmpMap["normal_cabinet_count"];
            rowMap["normal_total_count"] = tmpMap["normal_total_count"];
            rowMap["repair_cutter_mnemonic"] = tmpMap["repair_cutter_mnemonic"];
            rowMap["repair_cutter_model"] = tmpMap["repair_cutter_model"];
            rowMap["repair_shelves_count"] = tmpMap["repair_shelves_count"];
            rowMap["repair_cabinet_count"] = tmpMap["repair_cabinet_count"];
            rowMap["repair_total_count"] = tmpMap["repair_total_count"];
            rowMap["normal_cutter_sec"] = tmpMap["cutter_sec"].toString();
            rowMap["repair_cutter_sec"] = tmpMap["repair_cutter_sec"].toString();

            //当前的值
            float dncLift = tmpMap["dnc_life"].toFloat();//DNC寿命
            float normal_cutter_sec = tmpMap["cutter_sec"].toFloat();//新刀寿命
            float repair_cutter_sec = tmpMap["repair_cutter_sec"].toFloat();//修磨刀寿命
            float current_life = tmpMap["current_life"].toFloat();//DNC残余寿命
            if(existedMap.isEmpty()){
                //对比唯一键，在数据库中不存在，需插入一行新数据，需要按逻辑拿到当前刀的类型
                QString curPrepareType = "";
                if(dncLift == normal_cutter_sec || normal_cutter_sec - dncLift < 0.001){
                    curPrepareType = "new_tool";
                }
                if(dncLift == repair_cutter_sec || repair_cutter_sec - dncLift < 0.001){
                    curPrepareType = "repair_tool";
                }

                if(curPrepareType == ""){
                    curPrepareType = ttr("unKnow Type");
                }

                QVariantMap attrMap;
                attrMap["cur_cutter_type"] = curPrepareType;
                attrMap["action_time"] = sqlQuery.getNow();

                rowMap["attr_data"] = attrMap;

            }else{
                //数据库中有数据，需要对比数据库与当前
                float dbCurrent_life = existedMap["current_life"].toFloat();
                if(current_life <= dbCurrent_life || dbCurrent_life - current_life >= 0.001){
                    //刀具正常使用消耗---直接更新  残余寿命   rowMap在前面已赋值
                    QVariantMap attrMap;
                    attrMap["action_time"] = sqlQuery.getNow();

                    rowMap["attr_data"] = attrMap;
                }
                else{
                    //说明刀具发生了更换
                    QString onLineId = existedMap["id"].toString();

                    QVariantMap dbPrepareMap = prepareMap[onLineId].toMap();
                    if(dbPrepareMap.isEmpty()){
                        //对比唯一键，在数据库中不存在，需插入一行新数据，需要按逻辑拿到当前刀的类型

                        QString curPrepareType = "";
                        if(dncLift == normal_cutter_sec || normal_cutter_sec - dncLift < 0.001){
                            curPrepareType = "new_tool";
                        }
                        if(dncLift == repair_cutter_sec || repair_cutter_sec - dncLift < 0.001){
                            curPrepareType = "repair_tool";
                        }

                        if(curPrepareType == ""){
                            curPrepareType = ttr("unKnow Type");
                        }

                        QVariantMap attrMap;
                        attrMap["cur_cutter_type"] = curPrepareType;
                        attrMap["action_time"] = sqlQuery.getNow();

                        rowMap["attr_data"] = attrMap;
                    }
                    else{
                        //1.更新残余寿命   rowMap前面已赋值
                        //2.拿备刀的类型，赋值为当前刀类型
                        QVariantMap attrMap;
                        attrMap["cur_cutter_type"] = dbPrepareMap["prepare_type"].toString();
                        attrMap["action_time"] = sqlQuery.getNow();

                        //3.清空备刀onLine数据
                        rowMap["prepare_person"] = "";
                        rowMap["prepare_time"] = "";
                        rowMap["prepare_status"] = "";
                        rowMap["prepare_type"] = "";

                        rowMap["attr_data"] = attrMap;

                        //4.prepare表使用状态loaded_status更改为yes
                        TSqlUpdaterV2 updater;
                        updater.setTable("mes_prod_tooling_prepare");
                        updater.setData(QVariantMap{{"loaded_status","yes"}});
                        updater.setWhere("id",dbPrepareMap["id"]);

                        sqlQuery.updateRow(updater);
                        if (sqlQuery.lastError().isValid()) {
                            qDebug().noquote() << "error_text:  " << sqlQuery.lastError().text();
                            throw sqlQuery.lastError();
                        }
                    }
                }
            }

            TSqlInserterV2 inserter;
            inserter.setTable("mes_prod_tooling_online");
            inserter.setField(rowMap.keys());
            inserter.setData(rowMap);
            inserter.setUniqueField(QStringList() << "workcenter_code" << "partnumber"
                                    << "machine_code" << "op_name" << "cutter_position" << "op_no");
            inserter.setAutoIncrementField("id");
            sqlQuery.replaceRow(inserter).toString();
            if (sqlQuery.lastError().isValid()) {
                qDebug().noquote() << "error_text:  " << sqlQuery.lastError().text();
                throw sqlQuery.lastError();
            }
        }

        dataRes.setData("");
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesAccessoriesusedThread::saveTool(const QVariantMap &iParamMap)
{
    TDataResponse dataRes;
    //时间是由参数传入infoMap["prepare_time"].toString();，不能在每次插入是使用getNow  会有些许误差
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString nowStr = sqlQuery.getNow();
        QString nowUserName = APP->userName();
        QString stockinStr = "";
        qDebug().noquote() << "iParamMap:      " << TDataParse::variant2JsonStr(iParamMap);
        //QVariantMap rowMap = iParamMap["row"].toMap();//当前选中的行
        QVariantMap infoMap = iParamMap["info"].toMap();//信息

        //查询wms_warehouse_inventory表中是否存在该辅料
        TSqlSelectorV2 sqlSelector;
        sqlSelector.setTable("wms_warehouse_inventory");
        sqlSelector.setWhere("attr_data->>'workcenter_id'",infoMap["workcenter_id"].toString());
        sqlSelector.addWhere("tags","{accessories}");
        sqlSelector.addWhere("location_code",infoMap["site"].toString());
        sqlSelector.addWhere("material_code",infoMap["partnumber"].toString());
        sqlSelector.setField("*");
        QVariantMap format;
        format.insert("material_spec", "json");
        format.insert("extra_data", "json");
        format.insert("attr_data", "json");
        sqlSelector.setFieldFormat(format);
        QVariantMap orgDataMap = sqlQuery.selectMap(sqlSelector);
        if(sqlQuery.lastError().isValid()){
            qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }
        orgDataMap = TDataParse::removeVariantMapEmptyItem(orgDataMap);
        //查询当前最大的序列号stockin_id
        sqlSelector.clear();
        sqlSelector.setTable("wms_warehouse_stockin_detail");
        sqlSelector.setField("MAX(stockin_id) AS stockin_id");
        QVariantMap stockinMap = sqlQuery.selectMap(sqlSelector);
        if(sqlQuery.lastError().isValid()){
            qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }
        QString tmpData = nowStr;
        if (stockinMap["stockin_id"].toString().isEmpty()) {
            stockinStr = tmpData.replace("-","").replace(" ", "").replace(":", "") + "0001";
        } else {
            int num = stockinMap["stockin_id"].toString().mid(14).toInt() + 1;
            QString Str = QString::number(num);
            int length = Str.length();
            for (; length<4; length++) {
                Str = "0" + Str;
            }
            stockinStr = tmpData.replace("-","").replace(" ", "").replace(":", "") + Str;
        }

        //线边仓辅料数量判断及扣减线边仓数量的动作
        if (orgDataMap.isEmpty()) {
            QVariantMap inputMap;
            inputMap.insert("workcenter_id", infoMap.value("workcenter_id").toString());
            inputMap.insert("create_user", APP->userFullname());
            inputMap.insert("type", "auxiliary_stockout");
            QVariantMap detail_info;
            detail_info.insert("partnumber", infoMap.value("partnumber").toString());
            detail_info.insert("request_bits_count", infoMap.value("count").toString());
            detail_info.insert("bits_units", infoMap.value("units").toString());
            detail_info.insert("lot_no", infoMap.value("lot_no").toString());
            inputMap.insert("detail_info", detail_info);
            qDebug().noquote().nospace()<<TDataParse::variant2JsonStr(inputMap);

            QString url = APP->httpUrl();
            url = url.replace("ikm6", "ghp/ghp-stockout_line_info");
            THttpUtil httpUtil;
            httpUtil.setUrl(APP->httpUrl().remove("ikm6"));
            httpUtil.addHeader("Content-Type", "application/json;charset=utf8");
            THttpRequest httpRequest = httpUtil.httpRequest("ghp/ghp-stockout_line_info", inputMap);
            THttpReply reply = httpRequest.httpPost();
            TJsonApiResponse output = reply.toJsonApiResponse();
            if (!reply.errorString().isEmpty()) {
                throw TError(reply.errorString());
            }
            QVariantMap outputMap = output.toVariantMap();
            QVariant outData = outputMap.value("data");
            if (outData.type() == QMetaType::QVariantMap) {
                QVariantMap outMap = outputMap.value("data").toMap();
                if (!outMap.value("result").toInt()) {
                    throw TError(outMap.value("error_info").toString());
                }
            } else {
                throw TError(ttr("Return type error!"));
            }
        }


        //投放辅料条目
        QVariantMap dbMap;
        dbMap["material_code"] = infoMap.value("partnumber").toString();
        dbMap["material_name"] = infoMap.value("partnumber_name").toString();
        dbMap["lot_no"] = infoMap.value("lot_no").toString();
        dbMap["bits_units"] = infoMap.value("units").toString();
        dbMap["stockin_time"] = infoMap.value("prepare_time").toString();
        dbMap["request_bits_count"] = infoMap.value("count").toInt();
        dbMap["actual_bits_count"] = infoMap.value("count").toInt();
        dbMap["stockin_type"] = "direct_slot";
        dbMap["status"] = "sloted";
        dbMap["tags"] = "{accessories}";
        dbMap["remark"] = infoMap.value("remark").toString();
        dbMap["stockin_id"] = stockinStr.toLongLong();
        QVariantMap material_spec;
        material_spec["type"] = infoMap.value("partnumber_type").toString();
        dbMap["material_spec"] = material_spec;
        QVariantMap attrDataMap;
        attrDataMap["location_code"] = infoMap.value("site").toString();
        attrDataMap["warning_strategy"] = infoMap.value("warning_strategy").toString();
        attrDataMap["workcenter_id"] = infoMap.value("workcenter_id").toString();
        attrDataMap["warehouse_code"] = infoMap.value("workcenter_code").toString();
        attrDataMap["sum_area"] = infoMap.value("sum_area").toString();
        attrDataMap["sum_time"] = infoMap.value("sum_time").toString();
        dbMap["attr_data"] = attrDataMap;
        QVariantMap actionData;
        actionData["oper"] = nowUserName;
        actionData["creator"] = nowUserName;
        actionData["create_time"] = nowStr;
        dbMap["action_data"] = actionData;
        QVariantMap extraDataMap;
        extraDataMap["area_first_alarm"] = infoMap.value("area_first_alarm").toString();
        extraDataMap["area_second_alarm"] = infoMap.value("area_second_alarm").toString();
        extraDataMap["area_first_time"] = infoMap.value("area_first_time").toString();
        extraDataMap["area_second_time"] = infoMap.value("area_second_time").toString();
        extraDataMap["warning_strategy"] = infoMap.value("warning_strategy").toString();
        dbMap["extra_data"] = extraDataMap;

        //shareInvalidMap作废条目
        QVariantMap shareInvalidMap;
        shareInvalidMap.insert("stockout_id", stockinStr);
        shareInvalidMap.insert("material_code", orgDataMap.value("material_code").toString());
        shareInvalidMap.insert("material_name", orgDataMap.value("material_name").toString());
        shareInvalidMap.insert("bits_units", orgDataMap.value("bits_units").toString());
        shareInvalidMap.insert("material_spec", orgDataMap.value("material_spec").toMap());
        shareInvalidMap.insert("material_barcode", orgDataMap.value("material_code").toString());
        shareInvalidMap.insert("material_spec_description", orgDataMap.value("material_spec_description").toString());
        shareInvalidMap.insert("lot_no", orgDataMap.value("lot_no").toString());
        shareInvalidMap.insert("request_bits_count", orgDataMap.value("current_bits_count").toString());
        shareInvalidMap.insert("actual_bits_count", orgDataMap.value("current_bits_count").toString());
        shareInvalidMap.insert("stockout_type", "slot_scrap");
        shareInvalidMap.insert("stockout_time", nowStr);
        shareInvalidMap.insert("status", "scraped");
        QVariantMap actMap;
        actMap.insert("oper", nowUserName);
        shareInvalidMap.insert("action_data", actMap);
        shareInvalidMap.insert("tags", "{accessories}");
        shareInvalidMap.insert("attr_data", orgDataMap.value("attr_data").toMap());
        QVariantMap exMap = orgDataMap.value("extra_data").toMap();
        exMap.insert("inventory_id", orgDataMap.value("id").toString());
        shareInvalidMap.insert("extra_data", exMap);


        //LogMap
        QVariantMap shareLogMap = dbMap;
        shareLogMap["timing"] = nowStr;
        shareLogMap["warehouse_code"] = shareLogMap.value("attr_data").toMap().value("warehouse_code").toString();
        shareLogMap["current_bits_count"] = shareLogMap.value("actual_bits_count").toString();
        shareLogMap["input_bits_count"] = shareLogMap.value("actual_bits_count").toString();
        shareLogMap["location_code"] = shareLogMap.value("attr_data").toMap().value("location_code").toString();
        shareLogMap["search_keys"] = "{slot}";
        QVariantMap attr;
        attr.insert("workcenter_id", shareLogMap.value("attr_data").toMap().value("workcenter_id").toString());
        attr.insert("remark", QString(QStringLiteral("翻槽投料：从%1到%2")).arg(infoMap.value("slot_position").toString()).arg(shareLogMap["location_code"].toString()));
        shareLogMap["tags"] = "{accessories}";
        QVariantMap actionMap;
        actionMap["oper"] = nowUserName;
        QVariantMap extra;
        extra["inventory_id"] = "";
        extra["stockin_detail_id"] = "";
        shareLogMap["extra_data"] = extra;
        shareLogMap["action_data"] = actionMap;
        shareLogMap["attr_data"] = attr;
        shareLogMap.remove("actual_bits_count");
        shareLogMap.remove("remark");
        shareLogMap.remove("status");
        shareLogMap.remove("stockin_id");
        shareLogMap.remove("request_bits_count");
        shareLogMap.remove("stockin_type");

        //shareUpdataMap更新投料条目
        QVariantMap shareUpdataMap = orgDataMap;
        shareUpdataMap["stockin_time"] = nowStr;
        shareUpdataMap["input_bits_count"] = orgDataMap.value("input_bits_count").toInt() + infoMap["count"].toInt();
        shareUpdataMap["current_bits_count"] = orgDataMap.value("current_bits_count").toInt() + infoMap["count"].toInt();
        QVariantMap updataAttr = shareUpdataMap.value("attr_data").toMap();
        updataAttr["sum_area"] = orgDataMap.value("attr_data").toMap().value("residue_area").toInt() + infoMap["sum_area"].toInt();
        updataAttr["sum_time"] = orgDataMap.value("attr_data").toMap().value("residue_time").toInt() + infoMap["sum_time"].toInt();
        updataAttr["residue_area"] = updataAttr.value("sum_area");
        updataAttr["residue_time"] = updataAttr.value("sum_time");
        updataAttr["workcenter_id"] = infoMap.value("workcenter_id").toString();
        updataAttr["alarm"] = "0";
        shareUpdataMap["attr_data"] = updataAttr;
        QVariantMap updataAction;
        updataAction["oper"] = nowUserName;
        shareUpdataMap["action_data"] = updataAction;
        shareUpdataMap["extra_data"] = extraDataMap;

        TSqlInserterV2 inser;
        QVariantMap dataFormat;
        dataFormat["extra_data"] = "json_merge";
        dataFormat["action_data"] = "json_merge";
        dataFormat["attr_data"] = "json_merge";
        dataFormat["material_spec"] = "json_merge";


        int invalidA2Id;
        if (infoMap.value("prepare_type").toString() == "scrap") {  //为scrap
            if (!orgDataMap.isEmpty()) {
                //A-2、目标使用位置的作废操作
                //A-2.1:在wms_warehouse_stockout_detail表中生成作废条目
                QVariantMap shareInvalidA2Map = shareInvalidMap;
                invalidA2Id = doSqlWork(QString("wms_warehouse_stockout_detail"), shareInvalidA2Map);

                //A-2.2、在wms_warehouse_inventory_snapshot中记录作废操作日志；
                int invalidLogA22Id;
                QVariantMap invalidLogA2Map = shareLogMap;
                QVariantMap attr = invalidLogA2Map.value("attr_data").toMap();
                attr.insert("warning_strategy", orgDataMap.value("attr_data").toMap().value("warning_strategy").toString());
                attr.insert("workcenter_id", orgDataMap.value("attr_data").toMap().value("workcenter_id").toString());
                attr.insert("remark", QStringLiteral("投料自动作废"));
                QVariantMap action = invalidLogA2Map.value("action_data").toMap();
                action.insert("oper", nowUserName);
                exMap.insert("stockout_detail_id", invalidA2Id);
                exMap.insert("stockin_detail_id", invalidA2Id);
                invalidLogA2Map.insert("action_data", action);
                invalidLogA2Map.insert("attr_data", attr);
                invalidLogA22Id = doSqlWork(QString("wms_warehouse_inventory_snapshot"), invalidLogA2Map);

                //A-2.3、删除wms_warehouse_inventory中相关条目W04；
                TSqlDeleterV2 deletor;
                int deleteCount;
                deletor.setTable("wms_warehouse_inventory");
                deletor.setWhere("id", orgDataMap.value("id").toString());
                deleteCount = sqlQuery.deleteRow(deletor);
                if(sqlQuery.lastError().isValid()){
                    qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
                    throw sqlQuery.lastError();
                }
            }
        }
        if (infoMap.value("prepare_type").toString() == "add") {
            if (!orgDataMap.isEmpty()) {
                if (infoMap.value("slot_position").toString().isEmpty()) {
                    //A-4、目标使用位置的投料合并操作
                    //A-4.1、在wms_warehouse_stockin_detail表中生成投料条目（标识为W07），除以下字段外，其他值与步骤A-3.1完全相同；
                    int feedingMergerA41Id;
                    QVariantMap feedingMergerA4Map = dbMap;
                    QVariantMap tmpExtra2 = feedingMergerA4Map.value("extra_data").toMap();
                    tmpExtra2["inventory_id"] = orgDataMap.value("id").toString();
                    feedingMergerA4Map.insert("extra_data", tmpExtra2);
                    feedingMergerA41Id = doSqlWork(QString("wms_warehouse_stockin_detail"), feedingMergerA4Map);

                    //A-4.2、在wms_warehouse_inventory中更新投料条目（此条目即为步骤A-1的W04）
                    QVariantMap updataA42Map = shareUpdataMap;
                    TSqlUpdaterV2 updater;
                    updater.setTable("wms_warehouse_inventory");
                    updater.setData(updataA42Map);
                    updater.setWhere("id", orgDataMap.value("id").toString());
                    updater.setUpdatePolicy(dataFormat);
                    sqlQuery.updateRow(updater);
                    if(sqlQuery.lastError().isValid()){
                        qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
                        throw sqlQuery.lastError();
                    }
                    //A-4.3、在wms_warehouse_inventory_snapshot中记录投料操作日志；
                    int mergeLogA43Id;
                    QVariantMap mergeLogMap = shareLogMap;
                    mergeLogMap["input_bits_count"] = mergeLogMap.value("actual_bits_count").toInt();
                    mergeLogMap["current_bits_count"] = mergeLogMap.value("actual_bits_count").toInt();
                    mergeLogMap["search_keys"] = "{slot}";
                    mergeLogMap["tags"] = "{accessories}";
                    QVariantMap tmpExtra3 = mergeLogMap.value("extra_data").toMap();
                    tmpExtra3["inventory_id"] = orgDataMap.value("id").toString();
                    tmpExtra3["stockin_detail_id"] = feedingMergerA41Id;

                    QVariantMap tmpAttr3 = mergeLogMap.value("attr_data").toMap();
                    tmpAttr3["remark"] = QStringLiteral("追加投料");
                    mergeLogMap["extra_data"] = tmpExtra3;
                    mergeLogMap["attr_data"] = tmpAttr3;
                    mergeLogA43Id = doSqlWork(QString("wms_warehouse_inventory_snapshot"), mergeLogMap);
                } else {
                    //B5
                    int feedingMergerB5Id;
                    QVariantMap feedingMergerB5Map = dbMap;
                    feedingMergerB5Map["stockin_type"] = "transfer_slot";
                    QVariantMap extraB5Map = feedingMergerB5Map.value("extra_data").toMap();
                    extraB5Map.insert("inventory_id", orgDataMap.value("id").toString());
                    feedingMergerB5Map["extra_data"] = extraB5Map;
                    feedingMergerB5Id = doSqlWork(QString("wms_warehouse_stockin_detail"), feedingMergerB5Map);
                    //B-5.2、在wms_warehouse_inventory中更新投料条目（此条目即为步骤A-1的W04），需要更新以下字段：
                    QVariantMap updataFeedingB5Map = shareUpdataMap;
                    TSqlUpdaterV2 updater;
                    updater.setTable("wms_warehouse_inventory");
                    updater.setData(updataFeedingB5Map);
                    updater.setWhere("id", orgDataMap.value("id").toString());
                    updater.setUpdatePolicy(dataFormat);
                    sqlQuery.updateRow(updater);
                    if(sqlQuery.lastError().isValid()){
                        qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
                        throw sqlQuery.lastError();
                    }
                    //B-5.3、在wms_warehouse_inventory_snapshot中记录投料操作日志；
                    QVariantMap updataLogB5Map = shareLogMap;
                    QVariantMap extraB53Map = updataLogB5Map.value("extra_data").toMap();
                    extraB53Map["inventory_id"] = orgDataMap.value("id").toString();
                    extraB53Map["stockin_detail_id"] = feedingMergerB5Id;
                    QVariantMap attrB53Map = updataLogB5Map.value("attr_data").toMap();
                    attrB53Map["remark"] = QString(QStringLiteral("翻槽并追加投料：从%1到%2")).arg(infoMap.value("slot_position").toString().isEmpty()).arg(updataLogB5Map["location_code"].toString());
                }
            }
        }
        if (infoMap.value("prepare_type").toString() == "scrap" || (infoMap.value("prepare_type").toString() == "add" && orgDataMap.isEmpty())) {
            if (infoMap.value("slot_position").toString().isEmpty()) {
                //A-3、目标使用位置的投料操作：

                //A-3.2、在wms_warehouse_inventory中添加投料条目（标识为W06）；
                int feedingToInventoryA32Id;
                QVariantMap feedingToInventoryMap = dbMap;
                feedingToInventoryMap["warehouse_code"] = infoMap.value("workcenter_code").toString();
                feedingToInventoryMap["material_code"] = infoMap.value("partnumber").toString();
                feedingToInventoryMap["input_bits_count"] = feedingToInventoryMap.value("actual_bits_count").toString();
                feedingToInventoryMap["current_bits_count"] = feedingToInventoryMap.value("actual_bits_count").toString();
                feedingToInventoryMap["location_code"] = feedingToInventoryMap.value("attr_data").toMap().value("location_code");
                feedingToInventoryMap["tags"] = "{accessories}";
                QVariantMap tmpAttr1 = feedingToInventoryMap.value("attr_data").toMap();
                tmpAttr1["residue_area"] = tmpAttr1.value("sum_area").toString();
                tmpAttr1["residue_time"] = tmpAttr1.value("sum_time").toString();
                tmpAttr1["workcenter_id"] = infoMap["workcenter_id"].toString();
                tmpAttr1.remove("location_code");
                QVariantMap extraA32Map = feedingToInventoryMap.value("extra_data").toMap();
                extraA32Map.remove("inventory_id");
                feedingToInventoryMap["extra_data"] = extraA32Map;
                feedingToInventoryMap["attr_data"] = tmpAttr1;
                feedingToInventoryMap.remove("actual_bits_count");
                feedingToInventoryMap.remove("remark");
                feedingToInventoryMap.remove("status");
                feedingToInventoryMap.remove("stockin_id");
                feedingToInventoryMap.remove("request_bits_count");
                feedingToInventoryMap.remove("stockin_type");
                feedingToInventoryA32Id = doSqlWork(QString("wms_warehouse_inventory"), feedingToInventoryMap);

                //A-3.1、在wms_warehouse_stockin_detail表中生成投料条目（标识为W05）；
                int feedingA31Id;
                QVariantMap feedingA31Map = dbMap;
                QVariantMap extraA31Map = feedingA31Map.value("extra_data").toMap();
                extraA31Map["inventory_id"] = feedingToInventoryA32Id;
                feedingA31Map["extra_data"] = extraA31Map;
                QVariantMap attrA31Map = feedingA31Map.value("attr_data").toMap();
                attrA31Map["warehouse_code"] = orgDataMap.value("warehouse_code").toString();
                feedingA31Map["attr_data"] = attrA31Map;
                feedingA31Id = doSqlWork(QString("wms_warehouse_stockin_detail"), feedingA31Map);

                //A-3.3、在wms_warehouse_inventory_snapshot中记录投料操作日志；
                int feedingLogA33Id;
                QVariantMap feedingLogA33Map = shareLogMap;
                QVariantMap tmpAttr2 = feedingLogA33Map.value("attr_data").toMap();
                tmpAttr2["remark"] = "全新投料";

                QVariantMap tmpExtra = feedingLogA33Map.value("extra_data").toMap();
                tmpExtra["stockin_detail_id"] = feedingA31Id;
                tmpExtra["inventory_id"] = feedingToInventoryA32Id;

                feedingLogA33Map.insert("attr_data", tmpAttr2);
                feedingLogA33Map.insert("extra_data", tmpExtra);
                feedingLogA33Id = doSqlWork(QString("wms_warehouse_inventory_snapshot"), feedingLogA33Map);
            } else {
                //B3 + B4
                //B-3、目标使用位置的投料操作：

                //B-3.2、在wms_warehouse_inventory中添加投料条目（标识为W09）；
                int feedingInventorySlotId;
                QVariantMap feedingInventoryMap = dbMap;
                feedingInventoryMap["stockin_type"] = "transfer_slot";
                feedingInventoryMap["warehouse_code"] = infoMap.value("workcenter_code").toString();
                feedingInventoryMap["material_code"] = infoMap.value("partnumber").toString();
                feedingInventoryMap["input_bits_count"] = feedingInventoryMap.value("actual_bits_count").toString();
                feedingInventoryMap["current_bits_count"] = feedingInventoryMap.value("actual_bits_count").toString();
                feedingInventoryMap["location_code"] = feedingInventoryMap.value("attr_data").toMap().value("location_code");
                feedingInventoryMap["location_code"] = feedingInventoryMap.value("attr_data").toMap().value("location_code").toString();
                feedingInventoryMap["tags"] = "{accessories}";
                QVariantMap tmpattr = feedingInventoryMap.value("attr_data").toMap();
                tmpattr["residue_area"] = tmpattr.value("sum_area").toString();
                tmpattr["residue_time"] = tmpattr.value("residue_time").toString();
                tmpattr["workcenter_id"] = infoMap.value("workcenter_id").toString();
                tmpattr.remove("location_code");
                QVariantMap extraB32Map = feedingInventoryMap.value("extra_data").toMap();
                extraB32Map.remove("inventory_id");
                feedingInventoryMap["attr_data"] = tmpattr;
                feedingInventoryMap["extra_data"] = extraB32Map;
                feedingInventoryMap["tags"] = "{accessories}";
                feedingInventoryMap.remove("actual_bits_count");
                feedingInventoryMap.remove("remark");
                feedingInventoryMap.remove("status");
                feedingInventoryMap.remove("stockin_id");
                feedingInventoryMap.remove("request_bits_count");
                feedingInventoryMap.remove("stockin_type");
                feedingInventorySlotId = doSqlWork(QString("wms_warehouse_inventory"), feedingInventoryMap);

                //在wms_warehouse_stockin_detail表中生成投料条目（标识为W08）；除以下字段外，其他值与步骤A-3.1完全相同；
                int feedingSlotId;
                QVariantMap feedingSlot = dbMap;
                feedingSlot["stockin_type"] = "transfer_slot";
                QVariantMap tmpExtra = feedingSlot.value("extra_data").toMap();
                tmpExtra.value("inventory_id", feedingInventorySlotId);
                feedingSlotId = doSqlWork(QString("wms_warehouse_stockin_detail"), feedingSlot);


                //B-3.3、在wms_warehouse_inventory_snapshot中记录投料操作日志；
                int feedingLogSlotId;
                QVariantMap feedingLogSlotMap = shareLogMap;
                inser.clear();
                feedingLogSlotId = doSqlWork(QString("wms_warehouse_inventory_snapshot"), feedingLogSlotMap);

                //B-4.1、在wms_warehouse_stockout_detail表中生成作废条目（标识为W10）；
                int invalidId;
                QVariantMap invalidB4Map = shareInvalidMap;
                invalidB4Map["stockout_type"] = "transfer_scrap";
                invalidId = doSqlWork(QString("wms_warehouse_stockout_detail"), invalidB4Map);

                //B-4.2、在wms_warehouse_inventory_snapshot中记录作废操作日志；
                int invalidLogId;
                QVariantMap invalidLogB4Map = shareLogMap;
                QVariantMap attrB4Map = invalidLogB4Map.value("attr_data").toMap();
                attrB4Map["remark"] = QString(QStringLiteral("翻槽作废：从%1到%2")).arg(infoMap.value("slot_position").toString()).arg(invalidLogB4Map["location_code"].toString());
                invalidLogB4Map["attr_data"] = attrB4Map;
                QVariantMap extraB42Map = invalidLogB4Map.value("extra_data").toMap();
                extraB42Map["stockin_detail_id"] = invalidA2Id;
                invalidLogB4Map["extra_data"] = extraB42Map;
                invalidLogId = doSqlWork(QString("wms_warehouse_inventory_snapshot"), invalidLogB4Map);

                //B-4.3、删除wms_warehouse_inventory中相关条目L01；
                TSqlDeleterV2 deletor;
                int deleteCount;
                deletor.setTable("wms_warehouse_inventory");
                deletor.setWhere("id", infoMap.value("id").toString());
                deleteCount = sqlQuery.deleteRow(deletor);
                if(sqlQuery.lastError().isValid()){
                    qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
                    throw sqlQuery.lastError();
                }
            }
        }
        dataRes.setData(orgDataMap);
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesAccessoriesusedThread::obsoleteItem(const QVariantMap &iParamMap)
{
    qDebug().noquote() << "iParamMap:   " << TDataParse::variant2JsonStr(iParamMap);
    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {

        QString nowStr = sqlQuery.getNow();
        QString nowUserName = APP->userFullname();
        QString stockinStr = "";
        TSqlSelectorV2 sqlSelector;
        sqlSelector.setTable("wms_warehouse_inventory");
        sqlSelector.setWhere("id",iParamMap["id"].toString());
        sqlSelector.setField("*");
        QVariantMap format;
        format.insert("material_spec", "json");
        format.insert("extra_data", "json");
        format.insert("attr_data", "json");
        sqlSelector.setFieldFormat(format);
        QVariantMap orgDataMap = sqlQuery.selectMap(sqlSelector);
        if(sqlQuery.lastError().isValid()){
            qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }
        sqlSelector.clear();
        sqlSelector.setTable("wms_warehouse_stockin_detail");
        sqlSelector.setField("MAX(stockin_id) AS stockin_id");
        QVariantMap stockinMap = sqlQuery.selectMap(sqlSelector);
        if(sqlQuery.lastError().isValid()){
            qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }
        QString tmpData = nowStr;
        if (stockinMap["stockin_id"].toString().isEmpty()) {
            stockinStr = tmpData.replace("-","").replace(" ", "").replace(":", "") + "0001";
        } else {
            int num = stockinMap["stockin_id"].toString().mid(14).toInt() + 1;
            QString Str = QString::number(num);
            int length = Str.length();
            for (; length<4; length++) {
                Str = "0" + Str;
            }
            stockinStr = tmpData.replace("-","").replace(" ", "").replace(":", "") + Str;
        }

        QVariantMap obsoleteMap;
        obsoleteMap["stockout_id"] = stockinStr.toLongLong();
        obsoleteMap["material_code"] = iParamMap["material_code"].toString();
        obsoleteMap["material_name"] = iParamMap["material_name"].toString();
        obsoleteMap["material_barcode"] = iParamMap["material_code"].toString();
        obsoleteMap["material_spec"] = orgDataMap["material_spec"].toMap();
        obsoleteMap["material_spec_description"] = iParamMap["material_spec_description "].toString();
        obsoleteMap["lot_no"] = iParamMap["lot_no"].toString();
        obsoleteMap["request_bits_count"] = iParamMap["current_bits_count"].toString();
        obsoleteMap["actual_bits_count"] = iParamMap["current_bits_count"].toString();
        obsoleteMap["bits_units"] = iParamMap["bits_units"].toString();
        obsoleteMap["stockout_type"] = "direct_scrap";
        obsoleteMap["stockout_time"] = nowStr;
        obsoleteMap["status"] = "scraped";
        QVariantMap action_data;
        action_data["oper"] = nowUserName;
        obsoleteMap["action_data"] = action_data;
        obsoleteMap["tags"] = "{accessories}";
        QVariantMap extra_data = orgDataMap.value("extra_data").toMap();
        extra_data["inventory_id"] = iParamMap["id"].toString();
        obsoleteMap["extra_data"] = extra_data;
        QVariantMap attr_data = orgDataMap["atte_data"].toMap();
        attr_data["warehouse_code"] = iParamMap["warehouse_code"].toString();
        attr_data["location_code"] = iParamMap["location_code"].toString();
        attr_data["remark"] = orgDataMap["remark"].toString();
        obsoleteMap["attr_data"] = attr_data;

        QVariantMap dataFormat;
        dataFormat["extra_data"] = "json_merge";
        dataFormat["action_data"] = "json_merge";
        dataFormat["attr_data"] = "json_merge";
        dataFormat["material_spec"] = "json_merge";

        int dbId;
        TSqlInserterV2 insertor;
        insertor.setTable("wms_warehouse_stockout_detail");
        insertor.setData(obsoleteMap);
        insertor.setUpdatePolicy(dataFormat);
        dbId = sqlQuery.insertRow(insertor).toInt();
        if(sqlQuery.lastError().isValid()){
            qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }

        //写作废日志
        QVariantMap obsoleteLogMap;
        obsoleteLogMap["timing"] = nowStr;
        obsoleteLogMap["material_code"] = iParamMap["material_code"].toString();
        obsoleteLogMap["material_name"] = iParamMap["material_name"].toString();
        obsoleteLogMap["warehouse_code"] = iParamMap["warehouse_code"].toString();
        obsoleteLogMap["material_spec"] = orgDataMap["material_spec"].toMap();
        obsoleteLogMap["bits_units"] = iParamMap["bits_units"].toString();
        obsoleteLogMap["stockin_time"] = iParamMap["stockout_time"].toString();
        obsoleteLogMap["input_bits_count"] = iParamMap["input_bits_count"].toString();
        obsoleteLogMap["current_bits_count"] = iParamMap["current_bits_count"].toString();
        obsoleteLogMap["lot_no"] = iParamMap["lot_no"].toString();
        obsoleteLogMap["location_code"] = iParamMap["location_code"].toString();
        obsoleteLogMap["search_keys"] = "{scrap}";
        obsoleteLogMap["tags"] = "{accessories}";
        QVariantMap actionMap;
        actionMap["oper"] = nowUserName;
        obsoleteLogMap["action_data"] = actionMap;
        QVariantMap extraMap;
        extraMap["inventory_id"] = iParamMap["id"].toString();
        extraMap["stockout_detail_id"] = dbId;
        obsoleteLogMap["extra_data"] = extraMap;
        QVariantMap attrMap;
        attrMap["remark"] = QStringLiteral("人工作废");
        obsoleteLogMap["attr_data"] = attrMap;

        insertor.clear();
        insertor.setTable("wms_warehouse_inventory_snapshot");
        insertor.setData(obsoleteLogMap);
        insertor.setUpdatePolicy(dataFormat);
        dbId = sqlQuery.insertRow(insertor).toInt();
        if(sqlQuery.lastError().isValid()){
            qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }

        //物理删除
        TSqlDeleterV2 deleter;
        deleter.setTable("wms_warehouse_inventory");
        deleter.setWhere("id",iParamMap["id"].toString());
        int id = sqlQuery.deleteRow(deleter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        dataRes.setData(id);
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesAccessoriesusedThread::postponeAlarm(const QVariantMap &iParamMap)
{
    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        //时间需要累积原先的值,因为在刷新时还是会执行 sumTime - 当前时间
        TSqlSelectorV2 selector;
        selector.setTable("wms_warehouse_inventory");
        selector.fieldRef() << "attr_data->>'adjust_time' AS adjust_time" <<  "attr_data->>'adjust_area' AS adjust_area"<<"attr_data";
        selector.setWhere("id",iParamMap["id"].toString());
        selector.setFieldFormat("attr_data","json");
        QVariantMap adjustDataMap = sqlQuery.selectMap(selector);

        QString nowStr = sqlQuery.getNow();
        TSqlUpdaterV2 updater;
        updater.setTable("wms_warehouse_inventory");
        QVariantMap dbMap;
        QVariantMap attrMap = adjustDataMap["attr_data"].toMap();
        attrMap["adjust_area"] = QString::number(iParamMap["add_area"].toFloat() + adjustDataMap.value("adjust_area").toFloat());
        attrMap["adjust_time"] = QString::number(iParamMap["add_time"].toInt() + adjustDataMap.value("adjust_time").toInt());
        attrMap["alarm"] = "";
        dbMap["attr_data"] = attrMap;
        updater.setData(dbMap);
        updater.setWhere("id",iParamMap["id"].toString());
        int id = sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        //存历史表
        dbMap.clear();
        attrMap.clear();
        TSqlInserterV2 inserter;
        inserter.setTable("wms_warehouse_inventory_snapshot");
        dbMap["timing"] = nowStr;
        dbMap["warehouse_code"] = iParamMap["warehouse_code"].toString();
        QVariantMap material_spec;
        material_spec["type"] = iParamMap["type"].toString();
        dbMap["material_spec"] = material_spec;
        dbMap["material_code"] = iParamMap["material_code"].toString();
        dbMap["material_name"] = iParamMap["material_name"].toString();
        dbMap["bits_units"] = iParamMap["bits_units"].toString();;
        dbMap["stockin_time"] = iParamMap["stockin_time"].toString();
        dbMap["input_bits_count"] = iParamMap["input_bits_count"].toString();
        dbMap["current_bits_count"] = iParamMap["current_bits_count"].toString();
        dbMap["lot_no"] = iParamMap["lot_no"].toString();
        dbMap["location_code"] = iParamMap["location_code"].toString();
        dbMap["tags"] = "{accessories}";
        dbMap["search_keys"] = "{delay_alarm}";
        QVariantMap attr_data;
        attr_data["warning_strategy"] = iParamMap["warning_strategy"].toString();
        attr_data["workcenter_id"] = iParamMap["workcenter_id"].toString();
        dbMap["attr_data"] = attr_data;
        QVariantMap action_data;
        action_data["oper"] = iParamMap["oper"].toString();
        action_data["add_area"] = iParamMap["add_area"].toString();
        action_data["add_time"] = iParamMap["add_time"].toString();
        dbMap["action_data"] = action_data;
        QVariantMap extra_data;
        extra_data["inventory_id"] = iParamMap["id"].toString();
        dbMap["extra_data"] = extra_data;

        inserter.setData(dbMap);

        sqlQuery.insertRow(inserter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        dataRes.setData(id);
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}


void GhpMesAccessoriesusedThread::exeCallData(const QVariantMap &iParamMap)
{
    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.setTable("wms_warehouse_inventory");
        selector.setField("*");
        QVariantMap formatMap;
        formatMap["attr_data"] = "json";
        formatMap["extra_data"] = "json";
        formatMap["material_spec"] = "json";
        selector.setFieldFormat(formatMap);
        if(!(iParamMap.value("workcenter_id").toString().isEmpty())){
            selector.setWhere("attr_data->>'workcenter_id'",iParamMap.value("workcenter_id").toString());
        }

        QVariantList dbList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        QVariantList updateList;
        if(dbList.count() > 0){
            foreach (QVariant value, dbList) {
                QVariantMap tmpMap = value.toMap();
                QString workcenterId = tmpMap.value("attr_data").toMap().value("workcenter_id").toString();
                QVariantMap attMap = tmpMap.value("attr_data").toMap();
                QString timeStr = tmpMap.value("stockin_time").toString();
                float sumArea = tmpMap.value("attr_data").toMap().value("sum_area").toFloat(); //A01
                float sumTime = tmpMap.value("attr_data").toMap().value("sum_time").toFloat();
                float adjustArea = tmpMap.value("attr_data").toMap().value("adjust_area").toFloat(); //A02
                int adjustTime = tmpMap.value("attr_data").toMap().value("adjust_time").toInt();
                QString stockin_time = tmpMap.value("stockin_time").toString();
                QString warning_strategy = tmpMap.value("attr_data").toMap().value("warning_strategy").toString();

                //extra_data没用到，在查询语句中去掉以提升效率
                selector.clear();
                selector.setTable(QString("(SELECT SUM(count_area) FROM (SELECT ((CASE ATTR.value WHEN '' THEN '0' ELSE ATTR.value END)::INTEGER)*output_qty AS count_area,output_qty,TAB1.partnumber,wip_parts_id FROM (SELECT SUM((RESUME.attr_data->>'output_qty')::INTEGER) AS output_qty,PARTS.partnumber,RESUME.wip_parts_id FROM mes_wip_parts_prod_resume AS RESUME LEFT JOIN mes_wip_parts AS PARTS ON RESUME.wip_parts_id = PARTS.id WHERE RESUME.attr_data->>'workcenter_id' = '%1' AND RESUME.end_time > '%2'::TIMESTAMP GROUP BY PARTS.partnumber,RESUME.wip_parts_id) TAB1 LEFT JOIN mes_material_attr_value AS ATTR ON ATTR.partnumber = TAB1.partnumber AND ATTR.attr_class = 'ghp_product_info' AND ATTR.attr_name = 'pn_area') AS TAB2) TAB3").arg(workcenterId).arg(stockin_time));
                QVariantMap sumarea = sqlQuery.selectMap(selector);    //A09
                if (sqlQuery.lastError().isValid()) {
                    throw sqlQuery.lastError();
                }
                float residue_area = adjustArea + sumArea - sumarea.value("sum").toInt();
                tmpMap["residue_area"] = residue_area;


                QDateTime nowTime = QDateTime::fromString(APP->getServerNow(),"yyyy-MM-dd hh:mm:ss");//当前时间
                QDateTime stockinTime = QDateTime::fromString(timeStr,"yyyy-MM-dd hh:mm:ss");

                qlonglong realInt = stockinTime.secsTo(nowTime) / 60; //T04
                tmpMap["residue_time"] = sumTime - realInt + adjustTime;


                QVariantMap dbMap;
                QVariantMap metaMap = attMap;
                metaMap["residue_time"] = tmpMap.value("residue_time").toString();
                metaMap["residue_area"] = tmpMap.value("residue_area").toString();
                metaMap["workcenter_id"] = iParamMap.value("workcenter_id").toString();
                metaMap["adjust_area"] = adjustArea;
                metaMap["adjust_time"] = adjustTime;
                metaMap["sum_area"] = sumArea;
                metaMap["sum_time"] = sumTime;
                metaMap["warning_strategy"] = warning_strategy;
                dbMap["id"] = tmpMap.value("id").toString();
                dbMap["attr_data"] = metaMap;
                updateList.append(dbMap);
            }
        }


        //更新数据库  1.存剩余时间  2.保存  辅料的信息
        QString sqlStr = "UPDATE wms_warehouse_inventory SET attr_data = COALESCE(attr_data::jsonb, '{}'::jsonb) || :attr_data WHERE id = :id";

        sqlQuery.batchSql(sqlStr, updateList);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        dataRes.setData(QVariant());
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}


int GhpMesAccessoriesusedThread::doSqlWork(const QString &iTableName, QVariantMap &dataMap)
{
    TDataResponse dataRes;
    int workId;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlInserterV2 inser;
        QVariantMap dataFormat;
        dataFormat["extra_data"] = "json_merge";
        dataFormat["action_data"] = "json_merge";
        dataFormat["attr_data"] = "json_merge";
        dataFormat["material_spec"] = "json_merge";

        inser.setTable(iTableName);
        inser.setData(dataMap);
        inser.setUpdatePolicy(dataFormat);
        inser.setAutoIncrementField("id");
        workId = sqlQuery.insertRow(inser).toInt();
        if(sqlQuery.lastError().isValid()){
            qDebug().noquote() << "erro:    " << sqlQuery.lastError().text();
            throw sqlQuery.lastError();
        }

        dataRes.setData(workId);
        sqlQuery.commit();
        setInvokeResult(dataRes.toVariantMap());
        return workId;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
    return workId;
}

