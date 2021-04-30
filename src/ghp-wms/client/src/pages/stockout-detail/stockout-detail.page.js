import React, { Component } from 'react';
import { View, Text, DeviceEventEmitter, StyleSheet, FlatList, Image, Modal, TouchableOpacity, TextInput, ToastAndroid, Alert, TouchableWithoutFeedback, BackHandler } from 'react-native';
import { setHeight, setWidth, setText } from '~/utils/initSize.util';
import { grayColor, defaultFont, primaryColor, borderColor } from '~/config/constants.js'
import { Actions } from 'react-native-router-flux';
import Topbar from '~/components/topbar';
import Search from '~/components/search';
import Popover from '~/components/popover'
import { connect } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment'
import { Decimal } from 'decimal.js';
import IbdLoading from '~/components/ibdLoading'
class StockoutDetail extends Component {

  constructor(props) {
    super(props)
    this.state = {
      showPoper: false,
      dataList: [],
      refreshing: false,
      imgList: {
        empty1: require("~/assets/images/empty1.png")
      },
      modalVisible: false, //模态框是显示还是隐藏
      item: {}, //选中的条目
      index: '',//选中的条目
      showDatePicker: false, //是否显示日期
      loading: false //loading加载
    }
  }

  componentDidMount () {
    BackHandler.addEventListener('hardwareBackPress', this.onBackHandler);
    this.getStockoutDetailList()
  }

  componentWillUnmount () {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackHandler);
  }

  onBackHandler = () => {
    const { dataList } = this.state
    let flag = dataList.some(item => {
      return (item['current_count'] - 0) > 0
    })
    /**判断是否有数据需要保存*/
    /**return true 代表不能返回  return false 代表能返回 */
    let backFlag = true
    if (flag) {
      Alert.alert(
        "提示",
        "当前存在备料数据未存储,是否退出?",
        [
          {
            text: "取消",
            onPress: () => console.log('取消'),
            style: "cancel"
          },
          {
            text: "确定", onPress: () => {
              DeviceEventEmitter.emit('stockout')
              Actions.pop()
            }
          }
        ])
    } else {
      backFlag = false
    }
    if (!backFlag) {
      DeviceEventEmitter.emit('stockout')
    }
    return backFlag


  };


  getStockoutDetailList = () => {
    const { routeParams, getStockoutDetailById } = this.props
    this.setState({
      refreshing: true,
      dataList: []
    }, () => {
      getStockoutDetailById({
        id: routeParams.id
      }).then(res => {
        this.setState({
          refreshing: false,
          dataList: res.data
        })
      }, err => {
        this.setState({
          refreshing: false
        })
      })
    })
  }
  render () {
    const { showPoper, dataList, refreshing, modalVisible, selectItem, showDatePicker, loading } = this.state;
    const { routeParams } = this.props
    let topList = [
      {
        icon: 'closecircleo',
        name: '关闭单据',
        command: e => {
          this.closeOrder(e);
        },
      },
    ]
    return (
      <View style={{ flex: 1 }}>
        <Topbar bgMode={true} plus={true} leftPress={() => this.leftPress()} plusPress={() => this.plusPress()} leftText={routeParams.code} />
        {
          showPoper ? <Popover
            showPoper={showPoper}
            list={topList}
            onClose={() => this.onClose()}
          /> : null
        }
        <Search
          onChange={(searchText) => this.onSearch(searchText)}
          btnPress={() => this.onSave()}
          btnText="保存"></Search>
        <View style={styles.main}>
          <FlatList
            renderItem={({ item, index }) => this.renderItem(item, index)}
            data={dataList} refreshing={refreshing} onRefresh={() => this.onRefresh()}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={() => this.ListEmptyComponent()}>
          </FlatList>
        </View>

        {/* 模态框 */}
        {
          selectItem ? <Modal animationType='slide' visible={modalVisible} transparent={true}
            onRequestClose={() => { this.setState({ modalVisible: !modalVisible }) }}
          >
            <TouchableWithoutFeedback onPress={() => { this.setState({ modalVisible: false }) }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}></View>
            </TouchableWithoutFeedback>
            <View style={styles.modalBg} >
              <View style={styles.middleModal}>
                <View style={styles.middleTitle}>
                  <Text style={styles.middleText}>{selectItem.material_code}</Text>
                  <TouchableOpacity onPress={() => this.finishBtn()}>
                    <Text style={[styles.middleText, styles.middleFinish]}>完成</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.middleMaterial}>
                  <Text style={[styles.middleText, styles.middleGray]}>物料名称</Text>
                  <Text style={styles.middleText}>{selectItem.material_name}</Text>
                </View>
                <View style={styles.middleFooter}>
                  <View style={styles.middleFooterItem}>
                    <Text style={[styles.middleText, styles.middleGray]}>备料数量</Text>
                    <TextInput style={[styles.middleText, styles.middleInput]}
                      onChangeText={(value) => this.onChangeText(value, 'current_count')}
                      value={selectItem.current_count} keyboardType='numeric'></TextInput>
                  </View>
                  <TouchableOpacity style={styles.middleFooterItem} onPress={() => this.showDatePicker()}>
                    <Text style={[styles.middleText, styles.middleGray]}>生产时间</Text>
                    <Text style={[styles.middleText, styles.middleInput]}>
                      {selectItem.production_time}
                    </Text>
                  </TouchableOpacity>
                  {
                    showDatePicker &&
                    <DateTimePicker style={[styles.middleText]}
                      testID="dateTimePicker"
                      mode="date"
                      display="default"
                      value={
                        selectItem.production_time ?
                          new Date(moment(selectItem.production_time).format()) :
                          new Date()
                      }
                      onChange={(e, value) => this.changeDate(e, value)} />
                  }
                  <View style={styles.middleFooterItem}>
                    <Text style={[styles.middleText, styles.middleGray]}>批次</Text>
                    <TextInput style={[styles.middleText, styles.middleInput]}
                      onChangeText={(value) => this.onChangeText(value, 'lot_no')}
                      value={selectItem.lot_no}></TextInput>
                  </View>
                </View>
              </View>
            </View>
          </Modal> : null
        }

        {/* loading */}
        <IbdLoading show={loading}></IbdLoading>
      </View>
    )
  }

  /**有数据渲染时 */

  renderItem = (item, index) => {
    return (
      <TouchableOpacity style={styles.item} onPress={() => this.selectItem(item, index)}>
        <View style={styles.itemBorder}></View>
        <View style={styles.itemAside}>
          <Text>{item.material_name}</Text>
          <Text>{item.material_code}</Text>
        </View>
        <View style={[styles.itemCount]}>
          <View>
            <Text>待备</Text>
            <Text>{item.request_bits_count}</Text>
          </View>
          <View>
            <Text>已备</Text>
            <Text>{item.actual_bits_count}</Text>
          </View>
          <View>
            <Text>本次</Text>
            <Text>{item.current_count ? item.current_count : 0}</Text>
          </View>
        </View>
        <View style={styles.itemAside1}>
          {
            <View style={[styles.itemCircle, (item.current_count - 0 ? { backgroundColor: 'red', borderColor: 'red' } : null)]}></View>
          }
        </View>
      </TouchableOpacity>
    )
  }

  /**向上刷新 */
  onRefresh = () => {
    this.getStockoutDetailList()
  }
  /**数据为空的时候 */
  ListEmptyComponent = () => {
    const { imgList } = this.state
    return (
      <View style={styles.empty}>
        <Image source={imgList.empty1} style={styles.noData} />
      </View>
    )
  }
  /** 选择数据时*/
  selectItem = (item, index) => {
    let cloneItem = JSON.parse(JSON.stringify(item))
    cloneItem['production_time'] = null
    cloneItem['current_count'] = ''
    this.setState({
      modalVisible: true,
      selectItem: JSON.parse(JSON.stringify(cloneItem)),
      index: index
    })
  }
  leftPress = () => {
    const { dataList } = this.state
    let flag = dataList.some(item => {
      return (item['current_count'] - 0) > 0
    })
    /**判断是否有数据需要保存 */
    if (flag) {
      Alert.alert(
        "提示",
        "当前存在备料数据未存储,是否退出?",
        [
          {
            text: "取消",
            onPress: () => console.log('取消'),
            style: "cancel"
          },
          { text: "确定", onPress: () => this.cancelConfirm() }
        ])
    } else {
      DeviceEventEmitter.emit('stockout')
      Actions.pop()
    }
  }

  plusPress = () => {
    this.setState({
      showPoper: true
    })
  }
  /**点击关闭单据空白 */
  onClose = () => {
    this.setState({
      showPoper: false
    })
  }
  /**点击关闭单据按钮 */
  closeOrder = () => {
    /**先判断是否有尚未收料的明细 */
    const { dataList } = this.state
    if (dataList.length) {
      Alert.alert(
        "提示",
        "尚有收料明细,未达到备料数量,是否确认关闭单据?",
        [
          {
            text: "取消",
            onPress: () => this.setState({ showPoper: false }),
            style: "cancel"
          },
          { text: "确定", onPress: () => this.closeConfirm() }
        ])
    }
  }

  showDatePicker = () => {
    this.setState({
      showDatePicker: true
    })
  }

  /**日期选择的时候 */
  changeDate = (e, value) => {
    let { selectItem } = this.state;
    selectItem.production_time = moment(value).format('YYYY-MM-DD');
    this.setState({
      selectItem: selectItem,
      showDatePicker: false,
    });
  }
  /**input框选择 */
  onChangeText = (value, key) => {
    const { selectItem } = this.state;
    selectItem[key] = value
    this.setState({
      selectItem: selectItem
    })
  }

  finishBtn = () => {
    const { selectItem, index, dataList } = this.state
    console.log((selectItem.current_count - 0), 'lllllllll')
    let reg = /^(([1-9][0-9]*)|(([0]\.\d{1,2}|[1-9][0-9]*\.\d{1,2})))$/
    if (!reg.test(selectItem.current_count)) {
      return ToastAndroid.showWithGravity("备料数量格式不正确", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    if (selectItem.current_count - 0 <= 0) {
      return ToastAndroid.showWithGravity("备料数量不能小于0", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    if (selectItem.ctrl_info['lot_control'] === '1' && !selectItem['lot_no']) {
      return ToastAndroid.showWithGravity("批次管控,批次号必填", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    if (selectItem.ctrl_info['production_time_control'] === '1' && !selectItem['production_time']) {
      return ToastAndroid.showWithGravity("生产时间管控,批次号必填", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    let currentCount = selectItem['current_count'] - 0
    dataList[index]['current_count'] = dataList[index]['current_count'] ? (Decimal(dataList[index]['current_count'] - 0).add(Decimal(currentCount))).toString() : currentCount.toString()
    let key = (new Date().getTime()).toString()
    if (dataList[index]['detail']) {
      dataList[index]['detail'][key] = {
        lot_no: selectItem['lot_no'],
        prod_date: selectItem['production_time'],
        qty: selectItem['current_count'],
        time: moment().format('YYYY-MM-DD')
      }
    } else {
      dataList[index]['detail'] = {
        [key]: {
          lot_no: selectItem['lot_no'],
          prod_date: selectItem['production_time'],
          qty: selectItem['current_count'],
          time: moment().format('YYYY-MM-DD')
        }
      }
    }

    this.setState({
      dataList: dataList,
      modalVisible: false,
      index: ''
    })
  }

  /**返回确定 */
  cancelConfirm = () => {
    DeviceEventEmitter.emit('stockout')
    Actions.pop()
  }

  /**关闭确定 */
  closeConfirm = () => {
    this.setState({
      loading: true
    }, () => {
      const { closeReceipt, routeParams } = this.props
      closeReceipt({ id: routeParams.id }).then(res => {
        ToastAndroid.showWithGravity("关闭成功", ToastAndroid.SHORT, ToastAndroid.TOP)
        this.setState({
          showPoper: false,
          loading: false
        }, () => {
          Actions.pop()
          DeviceEventEmitter.emit('stockout')
        })
      }, err => {
        this.setState({
          loading: false
        })
        ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
      })
    })

  }

  /**搜索按钮 */
  onSearch = (val) => {
    const { dataList } = this.state
    if (val !== null && val !== undefined && val !== '') {
      let tmp = dataList.filter(item => {
        return (
          item['material_code'].toLowerCase().indexOf(val.toLowerCase()) >= 0 ||
          item['material_name'].toLowerCase().indexOf(val.toLowerCase()) >= 0
        );
      });
      this.setState({
        dataList: tmp,
      });
    } else {
      this.getStockoutDetailList();
    }

  }

  onSave = () => {
    const { dataList } = this.state
    const filterData = dataList.filter((item) => {
      if (item['current_count'] && item['current_count'] - 0 > 0) {
        return item
      }
    })
    if (!filterData.length) {
      return ToastAndroid.showWithGravity("没有可保存的数据", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    const { saveStockout } = this.props
    this.setState({
      loading: true
    }, () => {
      saveStockout({
        detailDate: filterData
      }).then(res => {
        this.setState({
          loading: false
        })
        ToastAndroid.showWithGravity("保存成功", ToastAndroid.SHORT, ToastAndroid.TOP)
        this.getStockoutDetailList()
      }, err => {
        this.setState({
          loading: false
        })
        ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
      })
    })

  }

}

const styles = StyleSheet.create({
  main: {
    borderTopColor: borderColor,
    borderTopWidth: 1,
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: setWidth(16),
    borderBottomColor: borderColor,
    borderBottomWidth: 1
  },
  itemBorder: {
    borderColor: primaryColor,
    borderWidth: 3,
    borderRadius: 5,
    marginRight: setWidth(10),
    marginVertical: setHeight(10)
  },
  itemAside: {
    width: '50%',
    marginVertical: setHeight(10)
  },
  itemCount: {
    width: '40%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderLeftColor: borderColor,
    borderLeftWidth: 1,
    paddingVertical: setHeight(10)

  },
  itemAside1: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: setHeight(10)
  },
  itemCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderColor: borderColor,
    borderWidth: 1
  },
  empty: {
    display: 'flex',
    alignItems: 'center'
  },
  noData: {
    width: setWidth(288),
    height: setHeight(335),
    marginTop: setHeight(380)
  },
  modalBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleModal: {
    width: '100%',
    maxHeight: setHeight(936),
    minHeight: setHeight(500),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#ffffff'
  },
  middleTitle: {
    borderBottomColor: borderColor,
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    height: setHeight(100),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: setWidth(16),
  },
  middleText: {
    fontSize: setText(defaultFont)
  },
  middleMaterial: {
    paddingHorizontal: setWidth(16),
    paddingVertical: setHeight(20),
  },
  middleFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  middleFooterItem: {
    flex: 1,
    marginHorizontal: setWidth(16)
  },
  middleGray: {
    color: grayColor
  },
  middleFinish: {
    color: primaryColor
  },
  middleInput: {
    borderBottomColor: borderColor,
    borderBottomWidth: 1,
    height: setHeight(50)
  },
  // tipModal: {
  //   width: "90%",
  //   height: setHeight(200),
  //   borderRadius: 10,
  //   backgroundColor: '#ffffff',
  //   display: 'flex',
  //   alignItems: 'center'
  // },
  // tipTitle: {
  //   fontSize: setText(26),
  //   paddingHorizontal: setWidth(16),
  //   height: setHeight(100),
  //   paddingTop: setHeight(40)
  // },
  // tipBtnList: {
  //   width: '100%',
  //   display: 'flex',
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  //   paddingHorizontal: setWidth(16)
  // }
})

const mapStateToProps = state => ({

})

const mapDispatchToProps = (dispatch) => ({
  getStockoutDetailById: dispatch.stockoutDetail.getStockoutDetailById,
  closeReceipt: dispatch.stockoutDetail.closeReceipt,
  saveStockout: dispatch.stockoutDetail.saveStockout
})
export default connect(mapStateToProps, mapDispatchToProps)(StockoutDetail);