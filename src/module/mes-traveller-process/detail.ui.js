[
  {
    name: 'formgridlayout',
    type: 'FormGridLayout',
    property: {
      columns: 2,
      label_alignment: 'AlignVCenter',
      margin: 20,
      horizontal_spacing: 10,
      vertical_spacing: 10,
      separator: ' ',
      separator_property: { minimum_width: 10, maximum_width: 10 },
    },
    child: [
      {
        name: 'id',
        type: 'LineEdit',
        title: self.ttr(''),
        pack: { label: self.ttr(''), column_span: 2 },
        state: function (obj) {
          return 'Hide'
        },
      },
      {
        name: 'process_code',
        type: 'LineEdit',
        title: self.ttr('Process Code'),
        pack: { label: self.ttr('Process Code'), column_span: 2 },
        validate: function (obj, val, title, moment, selff) {
          if (_.isEmpty(val)) {
            return title + self.ttr('NOTNULL')
          }
          if (!self.checkProcessUnique(val)) {
            return self.ttr('Process Code must be unique!')
          }
        },
        property: { enabled: true },
        state: function (obj, self) {
          var uid = this.getObject('id').getData()
          print('-------', uid)
          if (_.isEmpty(uid)) {
            return 'enable'
          } else {
            return 'disable'
          }
        },
      },
      {
        name: 'process_name',
        type: 'LineEdit',
        title: self.ttr('Process Name'),
        pack: { label: self.ttr('Process Name'), column_span: 2 },
        validate: 'NOTNULL',
        property: { enabled: true },
      },
      {
        name: 'seq',
        type: 'IntLineEdit',
        title: self.ttr('Seq'),
        pack: { label: self.ttr('Seq'), column_span: 2 },
        property: { enabled: true },
        validate: 'NOTNULL2',
      },
      {
        name: 'category',
        type: 'MultiComboBox',
        title: self.ttr('Category'),
        property: {
          item_list: TOPENM.enumList(
            'mes-traveller-process-category'
          ).toComboList(),
          name_format: 'A,B',
        },
        pack: { label: self.ttr('Category'), column_span: 2 },
      },
      {
        name: 'plant',
        type: 'MultiComboBox',
        title: self.ttr('Plant'),
        property: {
          item_list: TOPENM.enumList('mes-plant-list').toComboList(),
          name_format: 'A,B',
        },
        pack: { label: self.ttr('Plant'), column_span: 2 },
      },
      {
        name: 'description',
        type: 'LineEdit',
        title: self.ttr('Description'),
        pack: { label: self.ttr('Description'), column_span: 2 },
        property: { enabled: true },
      },
      {
        name: 'remark',
        type: 'LineEdit',
        title: self.ttr('Remark'),
        pack: { label: self.ttr('Remark'), column_span: 2 },
        property: { enabled: true },
      },
      {
        name: 'info_modules',
        type: 'MultiCheckBox',
        title: self.ttr('Info Modules'),
        property: {
          item_list: TOPENM.enumList('mes-partnumber-modules').toComboList(),
          name_format: 'A,B',
        },
        pack: { label: self.ttr('Info Modules'), column_span: 2 },
        getter: function (obj, self) {
          var curDataLst = obj.currentNames
          var resMap = {}
          if (curDataLst.length > 0) {
            resMap['info_modules'] = curDataLst.join(',')
          }
          return resMap
        },
        setter: function (obj, val, self) {
          if (_.isEmpty(val)) {
            obj.setData('value', '')
          } else {
            obj.setData('value', val['info_modules'])
          }
        },
      },
      {
        type: 'stretch',
      },
    ],
  },
]
