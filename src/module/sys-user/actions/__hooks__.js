// 保存联系人数据时的额外处理(标准产品中注释掉，项目配置需要时启用)
this.handleContactData = function (iContactData, iUserData) {
    var data = iContactData;
    data['attr_data'] = {
        staffid: _.toString(iUserData['staffid'])
    };
    return data;
}