import React, {Component} from 'react';
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Image,
  Modal,
  BackHandler,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import {connect} from 'react-redux';
import {Actions} from 'react-native-router-flux';

import {uniqBy as _uniqBy} from 'lodash';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Decimal} from 'decimal.js';

import Topbar from '~/components/topbar';
import Popover from '~/components/popover';
import Search from '~/components/search';
import IbdLoading from '~/components/ibdLoading';
import * as Constant from '~/config/constants';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';

import Http from '~/utils/http';

class StockinDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showPoper: false,
      detailList: [],
      selectItem: {},
      showDatePicker: false,
      showModel: false,
      mapList: [],
      refreshing: true,
      loading: false,
    };
  }

  componentDidMount() {
    this.initPage();
    BackHandler.addEventListener('hardwareBackPress', this.goBack);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.goBack);
  }

  initPage() {
    this.getDetailList();
    this.setState({
      mapList: [],
    });
  }
  onClose() {
    this.setState({showPoper: false});
  }
  onOpen() {
    this.setState({showPoper: true});
  }

  /**
   * 获取详情列表
   */

  getDetailList() {
    this.setState({
      refreshing: true,
    });
    let params = {
      stockin_id: this.props.routeParams.id,
    };
    Http.get('/stockin/getStockinDetailList', params).then(res => {
      this.setState({
        detailList: res.data,
        refreshing: false,
      });
    });
  }

  /**
   * 保存按钮
   */
  onSave() {
    let {mapList} = this.state;
    if (!mapList.length) {
      ToastAndroid.showWithGravityAndOffset(
        '没有可保存的数据',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        30,
      );
      return;
    }
    this.setState({loading: true});
    const {routeParams, username} = this.props;
    let params = {
      details: mapList,
      warehouse_code: routeParams.warehouse_code,
      username: username,
    };
    Http.post('/stockin/saveMaterialReceive', params)
      .then(res => {
        if (res.data === 'success') {
          this.setState({loading: false});
          // Actions.pop();
          ToastAndroid.showWithGravityAndOffset(
            '保存成功',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
            0,
            30,
          );
          this.initPage();
        }
      })
      .catch(err => {
        this.setState({loading: false});
      });
  }
  /**
   * 点击入库单详情
   * @param {*} item
   */
  clickItem(item) {
    let ele = JSON.parse(JSON.stringify(item));
    delete ele.current_count;
    delete ele.input_lot_no;
    delete ele.product_time;
    this.setState({
      showModel: true,
      selectItem: ele,
    });
  }

  /**
   * 关闭编辑框
   */

  closeModel() {
    this.setState({
      showModel: false,
      selectItem: {},
    });
  }

  showDatePicker() {
    this.setState({
      showDatePicker: true,
    });
  }

  /**
   * 日期改变的回调
   * @param {*} e
   * @param {*} value
   */

  changeDate(e, value) {
    let {selectItem} = this.state;
    if (value) {
      selectItem.product_time = moment(value).format('YYYY-MM-DD');
    } else {
      delete selectItem.product_time;
    }
    this.setState({
      selectItem: selectItem,
      showDatePicker: false,
    });
  }

  /**
   * 完成按钮的回调事件
   */

  onComplete() {
    let res = this.validate();
    if (res.code === 0) {
      ToastAndroid.showWithGravityAndOffset(
        res.text,
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        30,
      );
      return;
    }
    let {selectItem, detailList, mapList} = this.state;
    for (let item of detailList) {
      if (item.id === selectItem.id) {
        item.edit = true;
        item.sum_current_count = Number(
          Decimal.add(
            parseFloat(item.sum_current_count || 0),
            parseFloat(selectItem.current_count),
          ),
        );
      }
    }
    selectItem.input_time = moment().format('YYYY-MM-DD HH:mm:ss');
    mapList.push(selectItem);
    this.setState({
      detailList: detailList,
      showModel: false,
      mapList: mapList,
    });
  }
  /**
   * 验证
   * @returns
   */
  validate() {
    let res = {code: 1, text: 'success'};
    const {selectItem} = this.state;
    let ctrl_info = (selectItem.attr_data || {}).ctrl_info || {};
    if (
      selectItem.current_count === undefined ||
      selectItem.current_count === null ||
      selectItem.current_count === ''
    ) {
      res = {code: 0, text: '实收数量必填'};
      return res;
    }

    if (!this.checkNumber(selectItem.current_count)) {
      res = {code: 0, text: '实收数量格式不正确'};
      return res;
    }
    if (ctrl_info.production_time_control == '1') {
      //生产日期管控
      if (
        selectItem.product_time === undefined ||
        selectItem.product_time === null ||
        selectItem.product_time === ''
      ) {
        res = {code: 0, text: '该物料有生产日期管控，务必输入生产日期!'};
        return res;
      }
    }
    if (ctrl_info.lot_control == '1') {
      //批次管控
      if (
        selectItem.input_lot_no === undefined ||
        selectItem.input_lot_no === null ||
        selectItem.input_lot_no === ''
      ) {
        res = {code: 0, text: '该物料有批次管控，务必输入批次号!'};
        return res;
      }
    }

    if (ctrl_info.allow_more != '1') {
      //不允许超收
      let sum_count = Number(
        Decimal.add(
          parseFloat(selectItem.current_count),
          parseFloat(selectItem.sum_current_count || 0),
        ),
      );
      let total = Number(
        Decimal.add(sum_count, parseFloat(selectItem.actual_bits_count || 0)),
      );
      if (total > selectItem.request_bits_count) {
        res = {code: 0, text: '该物料不允许超收，请确认收料数量是否正确!'};
        return res;
      }
    }
    return res;
  }

  checkNumber(theObj) {
    let reg = /^[0-9]+.?[0-9]*$/;
    if (reg.test(theObj)) {
      return true;
    }
    return false;
  }

  itemChange(value, field) {
    let {selectItem} = this.state;
    selectItem[field] = value;
    this.setState({
      selectItem: selectItem,
    });
  }

  /**
   * 关闭单据按钮
   * @param {*} e
   */

  closeOrder(e) {
    Http.get('/stockin/getUncollectedCount', {
      stockin_id: this.props.routeParams.id,
    }).then(res => {
      if (res.data) {
        this.setState({
          showPoper: false,
        });
        Alert.alert(
          '提示',
          '尚有收料明细，未达到收料数量，是否确认关闭单据？',
          [
            {
              text: '取消',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {text: '确定', onPress: () => this.handleClose()},
          ],
        );
      } else {
        this.handleClose();
      }
    });
  }
  /**
   * 关闭单据
   */
  handleClose() {
    this.setState({loading: true});
    Http.post('/stockin/closeOrder', {
      stockin_id: this.props.routeParams.id,
    })
      .then(res => {
        if (res.data === 'success') {
          this.setState(
            {
              loading: false,
            },
            () => {
              Actions.pop();
              ToastAndroid.showWithGravityAndOffset(
                '关闭成功',
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
                0,
                30,
              );
            },
          );
        }
      })
      .catch(err => {
        this.setState({loading: false});
      });
  }

  /**
   * 搜索
   * @param {*} val
   */

  onSearch(val) {
    let {detailList} = this.state;
    if (val !== null && val !== undefined && val !== '') {
      let tmp = detailList.filter(item => {
        return (
          item['material_code'].toLowerCase().indexOf(val.toLowerCase()) >= 0 ||
          item['material_name'].toLowerCase().indexOf(val.toLowerCase()) >= 0
        );
      });
      this.setState({
        detailList: tmp,
      });
    } else {
      this.getDetailList();
    }
  }

  goBack = () => {
    const {mapList} = this.state;
    if (mapList.length) {
      Alert.alert('提示', '当前存在收料数据未存储，是否退出？', [
        {
          text: '取消',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: () => {
            DeviceEventEmitter.emit('stockin');
            Actions.pop();
          },
        },
      ]);
    } else {
      DeviceEventEmitter.emit('stockin');
      Actions.pop();
    }
    return true;
  };

  /**
   * 下拉刷新
   */

  onRefresh() {
    this.getDetailList();
    this.setState({
      mapList: [],
    });
  }

  renderItem({item}) {
    let ctrl_info = (item.attr_data || {}).ctrl_info || {};
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => this.clickItem(item)}>
        <View style={styles.leftAside}>
          <View style={styles.leftTop}>
            <Text style={styles.title}>{item.material_code}</Text>
            {ctrl_info.allow_more == '1' && (
              <Text style={[styles.icon, {backgroundColor: '#EF6767'}]}>
                超
              </Text>
            )}
            {ctrl_info.lot_control == '1' && (
              <Text style={[styles.icon, {backgroundColor: '#0ECF8E'}]}>
                批
              </Text>
            )}
            {ctrl_info.width_contril == '1' && (
              <Text style={[styles.icon, {backgroundColor: '#C71585'}]}>
                宽
              </Text>
            )}
            {ctrl_info.height_control == '1' && (
              <Text style={[styles.icon, {backgroundColor: '#0000CD'}]}>
                高
              </Text>
            )}
            {ctrl_info.length_control == '1' && (
              <Text style={[styles.icon, {backgroundColor: '#acc0d1'}]}>
                长
              </Text>
            )}
            {ctrl_info.supplier_control == '1' && (
              <Text style={[styles.icon, {backgroundColor: '#8c7acc'}]}>
                供
              </Text>
            )}
            {ctrl_info.production_time_control == '1' && (
              <Text style={[styles.icon, {backgroundColor: '#32AFF2'}]}>
                期
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.subTitle}>{item.material_name}</Text>
          </View>
        </View>
        <View style={styles.rightAside}>
          <View style={styles.rightItem}>
            <Text style={styles.desc}>计划</Text>
            <Text style={styles.count}>{item.request_bits_count || 0}</Text>
          </View>
          <View style={styles.rightItem}>
            <Text style={styles.desc}>实际</Text>
            <Text style={styles.count}>{item.actual_bits_count || 0}</Text>
          </View>
          <View style={styles.rightItem}>
            <Text style={styles.desc}>本次</Text>
            <Text style={styles.count}>{item.sum_current_count || ''}</Text>
          </View>
        </View>
        <View
          style={[
            styles.cricle,
            {
              backgroundColor: item.edit ? 'red' : 'transparent',
              borderColor: item.edit ? 'red' : '#ccc',
            },
          ]}
        />
      </TouchableOpacity>
    );
  }
  render() {
    let {
      showPoper,
      detailList,
      showModel,
      selectItem,
      showDatePicker,
      refreshing,
      loading,
    } = this.state;
    const {routeParams} = this.props;
    let topList = [
      {
        icon: 'closecircleo',
        name: '关闭单据',
        command: e => {
          this.closeOrder(e);
        },
      },
    ];
    return (
      <View style={styles.container}>
        <IbdLoading show={loading} />

        <Topbar
          bgMode={true}
          leftText={routeParams.code}
          plus={true}
          // rightText={
          //   routeParams.action_data.create_time
          //     ? moment(routeParams.action_data.create_time).format('YYYY-MM-DD')
          //     : ''
          // }
          plusPress={() => this.onOpen()}
          leftPress={() => this.goBack()}
        />
        {showPoper && (
          <Popover
            showPoper={showPoper}
            list={topList}
            onClose={() => this.onClose()}
          />
        )}
        <Search
          autoFocus={false}
          btnText="保存"
          btnPress={val => this.onSave(val)}
          onChange={val => this.onSearch(val)}
        />

        <FlatList
          onRefresh={() => this.onRefresh()}
          refreshing={refreshing}
          data={detailList}
          renderItem={item => this.renderItem(item)}
          keyExtractor={item => item.id + ''}
        />

        {!detailList.length && (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assets/images/empty1.png')}
              style={styles.empty}
            />
          </View>
        )}
        {/* 底部弹出框 */}
        {showModel && (
          <Modal animationType="fade" transparent={true}>
            <View style={styles.model}>
              <TouchableOpacity
                onPress={() => this.closeModel()}
                style={styles.modelEmpty}
              />
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.font}>{selectItem.material_code}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      this.onComplete();
                    }}>
                    <Text style={[styles.btn, styles.font]}>完成</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.font, styles.grayFont]}>物料名称</Text>
                  <Text style={styles.font}>{selectItem.material_name}</Text>
                </View>
                <View style={styles.valueArea}>
                  <View style={styles.valueItem}>
                    <Text style={[styles.font, styles.grayFont]}>实收数量</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={
                        selectItem.current_count
                          ? selectItem.current_count + ''
                          : ''
                      }
                      style={styles.value}
                      onChangeText={text =>
                        this.itemChange(text, 'current_count')
                      }
                    />
                  </View>
                  <View style={styles.valueItem}>
                    <Text style={[styles.font, styles.grayFont]}>生产日期</Text>
                    <TouchableOpacity
                      onPress={() => this.showDatePicker()}
                      style={styles.value}>
                      <Text style={styles.productTime}>
                        {selectItem.product_time}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        style={styles.value}
                        testID="dateTimePicker"
                        mode="date"
                        display="default"
                        value={
                          selectItem.product_time
                            ? new Date(selectItem.product_time)
                            : new Date()
                        }
                        onChange={(e, value) => this.changeDate(e, value)}
                      />
                    )}
                  </View>
                  <View style={styles.valueItem}>
                    <Text style={[styles.font, styles.grayFont]}>批次</Text>
                    <TextInput
                      value={selectItem.input_lot_no}
                      onChangeText={text =>
                        this.itemChange(text, 'input_lot_no')
                      }
                      style={styles.value}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  item: {
    marginBottom: setHeight(16),
    flexDirection: 'row',
    minHeight: setHeight(150),
    borderBottomColor: '#e8e8e8',
    borderBottomWidth: 1,
    padding: setWidth(16),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftAside: {
    width: '50%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: '#e8e8e8',
  },
  rightAside: {
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightItem: {},
  count: {
    fontSize: setText(Constant.defaultFont),
    color: Constant.grayColor,
    textAlign: 'center',
    marginTop: setHeight(16),
  },
  leftTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  icon: {
    width: setWidth(50),
    height: setHeight(50),
    borderRadius: setWidth(25),
    backgroundColor: 'blue',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
    marginRight: setWidth(8),
  },
  title: {
    fontSize: setText(Constant.defaultFont),
  },
  subTitle: {
    fontSize: setText(Constant.defaultFont),
    color: Constant.grayColor,
  },
  desc: {
    fontSize: setText(Constant.defaultFont),
    color: Constant.grayColor,
    textAlign: 'center',
  },
  cricle: {
    width: setWidth(20),
    height: setHeight(20),
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: setWidth(10),
  },
  model: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  modelEmpty: {
    flex: 1,
    backgroundColor: '#000',
    opacity: 0.3,
  },
  content: {
    width: '100%',
    minHeight: setHeight(500),
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    padding: setWidth(16),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  font: {
    fontSize: setText(Constant.defaultFont),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: setHeight(100),
    alignItems: 'center',
    borderBottomColor: Constant.borderColor,
    borderBottomWidth: 1,
  },
  btn: {
    color: Constant.primaryColor,
  },
  grayFont: {
    color: Constant.grayColor,
  },
  row: {
    minHeight: setHeight(120),
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderBottomColor: Constant.borderColor,
    borderBottomWidth: 1,
    marginBottom: setWidth(16),
    paddingBottom: setHeight(16),
  },
  valueArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueItem: {
    width: '30%',
  },
  value: {
    height: setHeight(100),
    fontSize: setText(Constant.defaultFont),
    borderBottomWidth: 1,
    borderBottomColor: Constant.borderColor,
  },
  productTime: {
    fontSize: setText(Constant.defaultFont),
    height: '100%',
    textAlignVertical: 'center',
  },
  emptyContainer: {
    height: Constant.ScreenHeight - setHeight(250),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    width: setWidth(288),
    height: setHeight(335),
  },
});

const mapStateToProps = state => ({
  username: state.login.username || '',
});

const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(StockinDetail);
