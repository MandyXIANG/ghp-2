[
    {
        name: 'splitter',
        type: 'Splitter',
        property:
        {
            children_collapsible: false,
            orientation: "Horizontal",
            stylesheet: "QSplitter::handle{background:#D5D5D5}",
        },
        pack: {},

        child: [
            {
                name: 'vbox1',
                type: 'VboxLayout',
                property: { spacing: 0, margin: 0 },
                pack: {},
                child: [
                    {
                        name: 'toolbar',
                        type: 'ToolBar',
                        property: { style: "size=normal" },
                        pack: {},
                        child: [
                            {
                                name: 'move_top',
                                type: 'Action',
                                property: { text: self.ttr('Move Top'), icon: 'angle-double-up', shortcut: '', tooltip: '', style: 'button_style=icon' },
                                callback: function () {
                                    self.moveSelectedProcess("top");
                                },
                            },
                            {
                                name: 'move_up',
                                type: 'Action',
                                property: { text: self.ttr('Move Up'), icon: 'angle-up', shortcut: '', tooltip: '', style: 'button_style=icon' },
                                callback: function () {
                                    self.moveSelectedProcess("up");
                                },
                            },
                            {
                                name: 'move_down',
                                type: 'Action',
                                property: { text: self.ttr('Move Down'), icon: 'angle-down', shortcut: '', tooltip: '', style: 'button_style=icon' },
                                callback: function () {
                                    self.moveSelectedProcess("down");
                                },
                            },
                            {
                                name: 'move_bottom',
                                type: 'Action',
                                property: { text: self.ttr('Move Bottom'), icon: 'angle-double-down', shortcut: '', tooltip: '', style: 'button_style=icon' },
                                callback: function () {
                                    self.moveSelectedProcess("bottom");
                                },
                            },
                            {
                                name: 'save',
                                type: 'Action',
                                property: { text: self.ttr('Save'), icon: 'save', shortcut: '', tooltip: '', style: 'button_style=both' },
                                callback: function () {
                                    self.saveData();
                                },
                            },
                            {
                                name: 'stretch',
                                type: 'Stretch'
                            },
                            {
                                name: 'searchentry',
                                type: 'SearchEntry',
                                property: {
                                    searchDelayTime: '1'
                                },
                            },
                            {
                                name: 'refresh',
                                type: 'Action',
                                property: { text: self.ttr('Refresh'), icon: 'refresh', shortcut: '', tooltip: '', style: 'button_style=icon' },
                                callback: function () {
                                    self.reload();
                                },
                            },
                        ]
                    },
                    {
                        name: 'order_view',
                        type: 'TreeView',
                    },
                ]
            },
            {
                name: 'wgt',
                type: 'Widget',
                state: function () {
                    return 'Hide';
                },
                child: {
                    name: 'vbox2',
                    type: 'VboxLayout',
                    property: { spacing: 0, margin: 0 },
                    pack: {},
                    child: [
                        {
                            name: 'toolbar1',
                            type: 'ToolBar',
                            property: { style: "size=normal" },
                            pack: {},
                            child: [
                                // {
                                //     name: 'edit',
                                //     type: 'Action',
                                //     property: { text: self.ttr('Edit'), icon: 'edit', shortcut: '', tooltip: '', style: 'button_style=both' },
                                //     callback: function () {
                                //         self.edit();
                                //     },
                                // },
                                {
                                    name: 'stretch1',
                                    type: 'Stretch'
                                },
                                {
                                    name: 'searchentryright',
                                    type: 'SearchEntry',
                                    property: {
                                        optionList: [
                                            { name: 'process_code', text: self.ttr('Process Code') },
                                            // { name: 'status', text: self.ttr('Status') }
                                        ],
                                        searchDelayTime: '1'
                                    },
                                },
                                {
                                    name: 'reload',
                                    type: 'Action',
                                    property: { text: self.ttr('Refresh'), icon: 'refresh', shortcut: '', tooltip: '', style: 'button_style=icon' },
                                    callback: function () {
                                        self.refreshTree();
                                    },
                                },
                            ]
                        },
                        {
                            name: 'process_view',
                            type: 'TreeView'
                        },
                    ]
                },
            },
        ]
    },
]
