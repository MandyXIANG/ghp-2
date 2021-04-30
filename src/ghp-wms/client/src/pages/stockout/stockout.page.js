import React, { Component } from 'react';
import { Text, View, FlatList, StyleSheet, Image, TouchableOpacity, ToastAndroid, DeviceEventEmitter } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/AntDesign';
import { setHeight, setWidth, setText } from '~/utils/initSize.util';
import { grayColor, defaultFont,borderColor } from '~/config/constants.js'
import { Actions } from 'react-native-router-flux';
import Topbar from '~/components/topbar';

class Stockout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imgList: {
        empty1: require("~/assets/images/empty1.png")
      },
      dataList: [],
      refreshing: false,
      pageSize: 20,
      pageNo: 1,
      total: 0 //总计条数
    };
  }

  componentDidMount () {
    const { pageSize, pageNo } = this.state
    this.getStockoutList(pageSize, pageNo)
    DeviceEventEmitter.addListener('stockout', () => {
      this.setState({
        pageSize: 20,
        pageNo: 1
      }, () => {
        this.getStockoutList(20, 1)
      })
    })
  }

  getStockoutList = (pageSize, pageNo) => {
    console.log(this.props.routeParams)
    const { getStockoutList, routeParams } = this.props;
    const { dataList } = this.state;
    this.setState({
      refreshing: true
    }, () => {
      getStockoutList({
        warehouse_code: routeParams.warehouse_code,
        type: routeParams.name,
        pageSize: pageSize,
        pageNo: pageNo
      }).then(res => {
        if (pageNo === 1) { //代表第一页
          this.setState({
            dataList: res.data.data,
            refreshing: false,
            total: res.data.total
          })
        } else {
          this.setState({
            dataList: dataList.concat(res.data.data),
            refreshing: false,
            total: res.data.total
          })
        }

      }, err => {
        this.setState({
          refreshing: false
        })
        ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
      })
    })
  }

  leftPress = () => {
    DeviceEventEmitter.emit('home')
    Actions.pop()
  }

  render () {
    const { dataList, refreshing } = this.state
    return (
      <View style={{ flex: 1 }}>
        <Topbar
          leftText="出库"
          plus={false}
          leftPress={() => this.leftPress()}
        />
        <FlatList
          refreshing={refreshing}
          ListEmptyComponent={() => this.ListEmptyComponent()} data={dataList}
          renderItem={({ item, index }) => this.renderItem(item, index)}
          keyExtractor={item => item.id.toString()}
          onRefresh={() => this.onRefresh()}
          onEndReached={() => this.onEndReached()}
          onEndReachedThreshold={0.5}
        ></FlatList>

      </View>
    );
  }

  /**渲染时有数据的时候 */
  renderItem = (item) => {
    return (
      <TouchableOpacity onPress={() => this.selectItem(item)}>
        <View style={styles.item}>
          <Text style={styles.itemAside}>{item.code}</Text>
          <View style={[styles.itemAside,]}>
            <Text style={styles.itemMiddle}>{item.plan_stockout_time}</Text>
            <Text style={[styles.itemMiddle, { color: grayColor }]}>{item.request_workshift}</Text>
          </View>
          <View style={styles.itemIcon}>
            <Icon
              name={'right'}
              size={setText(60)}
              color={grayColor}
              style={styles.itemMiddle}
            />
          </View>
        </View>
      </TouchableOpacity>

    )
  }
  /**渲染时没有数据的时候 */
  ListEmptyComponent = () => {
    const { imgList } = this.state
    return (
      <View style={styles.empty}>
        <Image source={imgList.empty1} style={styles.noData} />
      </View>
    )
  }
  /**选择某一条数据 */
  selectItem = (item) => {
    console.log(item, 'itemitemitemtiemitemitem')
    Actions.push('stockoutDetail', {
      routeParams: {
        ...item
      }
    })
  }
  /**刷新事件 */
  onRefresh = () => {
    this.setState({
      pageSize: 20,
      pageNo: 1
    }, () => {
      this.getStockoutList(20, 1)
    })
  }
  /**当列表被滚动到距离内容最底部不足onEndReachedThreshold的距离时调用 */
  onEndReached = () => {
    console.log(456)
    const { pageSize, pageNo, total, dataList } = this.state
    console.log(typeof total, total, dataList.length, 'totaltotal')
    if (dataList.length <= total) {
      this.setState({
        pageNo: pageNo + 1
      }, () => {
        this.getStockoutList(pageSize, pageNo)
      })
    }
  }
}
const styles = StyleSheet.create({
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: setWidth(16),
    borderBottomColor: borderColor,
    borderBottomWidth: 1,
    paddingBottom: setHeight(20)
  },
  itemAside: {
    width: '45%',
    fontSize: setText(defaultFont),
    height: '100%'
  },
  itemIcon: {
    width: '10%',
  },
  itemMiddle: {
    textAlign: 'right'
  },
  empty: {
    display: 'flex',
    alignItems: 'center'
  },
  noData: {
    width: setWidth(288),
    height: setHeight(335),
    marginTop: setHeight(380)
  }
})

const mapStateToProps = (state) => ({
  selectWarehouse: state.home.selectWarehouse
})

const mapDispatchToProps = (dispatch) => ({
  getStockoutList: dispatch.stockout.getStockoutList
})

export default connect(mapStateToProps, mapDispatchToProps)(Stockout);
