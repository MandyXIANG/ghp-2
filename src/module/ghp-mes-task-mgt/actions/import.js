var self = this;
try {
    var HTTP_URL = APP.httpUrl();
    var url = _.trimRight(HTTP_URL, 'ikm6') + 'ghp2/ghp-get_inventory_info';
    var xhr = new XMLHttpRequest;
    xhr.setRequestHeader('Content-Type', 'text/plain;chartset=utf-8');
    xhr.open('POST', url, false);
    var param = {};
    xhr.send(JSON.stringify(param));
    if (xhr.status !== 200) {
        TMessageBox.error('', 'Call ghp-get_mainplan_info api error!');
        return;
    }
    self.refresh();
} catch (e) {
    print(e);
}

/*---ACTION---
ICON: ""
LABEL: "Import Info"
LABEL_ZHCN: "导入仓库"
LABEL_ZHTW: "導入倉庫"
ACCEL: ""
TOOLTIP: "New Parts Info"
TOOLTIP_ZHCN: "导入仓库"
TOOLTIP_ZHTW: "導入倉庫"
CHECKED: ""
GROUP: ""
LABEL_EN: ""
LABEL_JP: ""
TOOLTIP_EN: ""
TOOLTIP_JP: ""
PERMISSION: "ghp-mes-task-edit"
STYLE: "button_style=text"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/