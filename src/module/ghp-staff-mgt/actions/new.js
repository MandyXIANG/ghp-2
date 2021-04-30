try {
    var tab = this.tableView();
    tab.unselectAll();
    var dataMap = {
        "status":"active",
        "product_category":"{staffmgt}",
        "action_data.create_time":_.toString(APP.getServerNow()),
        "action_data.creator":_.toString(APP.userFullname()),
    };
    var uiloader = this.uiLoader();

    this.newItem();
    if (_.isValid(uiloader)) {
        uiloader.loadValues(dataMap, false);
    }
} catch(e) {
    print(e);
}



/*---ACTION---
ICON: "plus-circle"
LABEL: "New"
LABEL_ZHCN: "新建"
LABEL_ZHTW: "新建"
ACCEL: "Ctrl+N"
TOOLTIP: "New"
TOOLTIP_ZHCN: "新建"
TOOLTIP_ZHTW: "新建"
PERMISSION: "ghp-mes-staff-new"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/