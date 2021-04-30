import React, {Component} from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  FlatList,
  DeviceEventEmitter,
  Image,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import {Actions} from 'react-native-router-flux';
import {connect} from 'react-redux';

import {uniqBy as _uniqBy} from 'lodash';

import Topbar from '~/components/topbar';
import Popover from '~/components/popover';
import Search from '~/components/search';
import * as Constant from '~/config/constants';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import Http from '~/utils/http';

class Stockin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      list: [],
      page: 1,
      refreshing: true,
    };
  }
  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.goBack);
    this.getOrderList(1);
    this.backListener = DeviceEventEmitter.addListener('stockin', () => {
      this.getOrderList(1);
    });
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.goBack);
    this.backListener.remove();
  }
  /**
   * 获取入库单列表
   * @param {*} page
   */
  getOrderList(page) {
    this.setState({
      refreshing: true,
    });
    let {list} = this.state;
    const {routeParams} = this.props;
    let params = {
      warehouse_code: routeParams.warehouse_code,
      type: routeParams.name,
      page: page,
    };
    Http.post('/stockin/getStockinList', params).then(res => {
      this.setState({
        list: _uniqBy(list.concat(res.data), 'id'),
        refreshing: false,
      });
    });
  }

  /**
   * 滚动翻页
   */

  scrollToEnd() {
    let {page} = this.state;
    this.setState({
      page: page + 1,
    });
    this.getOrderList(page + 1);
  }
  // onSerch(val) {
  // }

  /**
   * 跳转至详情
   * @param {*} item
   */
  clickItem(item) {
    const {routeParams} = this.props;
    Actions.push('stockinDetail', {
      routeParams: {
        warehouse_code: routeParams.warehouse_code,
        ...item,
      },
    });
  }

  goBack = () => {
    DeviceEventEmitter.emit('home');
    Actions.pop();
  };

  renderItem({item}) {
    return (
      <TouchableOpacity
        onPress={() => this.clickItem(item)}
        style={styles.item}>
        <View style={styles.itemAside}>
          <Text style={styles.itemTop}>{item.code}</Text>
          <Text style={styles.itemBtm}>
            {item.transport_data.supplier_name}
          </Text>
        </View>
        <View style={[styles.itemAside]}>
          <Text
            style={[
              styles.itemTop,
              {textAlign: 'right', paddingRight: setWidth(16)},
            ]}>
            {item.attr_data.stockin_time}
          </Text>
          <Text
            style={[
              styles.itemBtm,
              {textAlign: 'right', paddingRight: setWidth(16)},
            ]}>
            {item.attr_data.index_column}
          </Text>
        </View>
        <Icon name="right" color={Constant.grayColor} size={setText(50)} />
      </TouchableOpacity>
    );
  }
  render() {
    const {list, refreshing} = this.state;

    return (
      <View>
        <Topbar leftText="入库" leftPress={() => this.goBack()} />
        {/* <Search autoFocus={false} btnPress={val => this.onSerch(val)} /> */}
        <FlatList
          style={styles.list}
          data={list}
          renderItem={item => this.renderItem(item)}
          keyExtractor={item => item.id + ''}
          onEndReached={() => this.scrollToEnd()}
          onEndReachedThreshold={0.1}
          onRefresh={() => this.getOrderList(1)}
          refreshing={refreshing}
        />
        {!list.length && (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assets/images/empty1.png')}
              style={styles.empty}
            />
          </View>
        )}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  list: {
    padding: setWidth(16),
  },
  item: {
    marginBottom: setHeight(16),
    borderBottomColor: Constant.borderColor,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: setHeight(150),
  },
  itemAside: {
    height: '100%',
    width: '45%',
  },
  itemTop: {
    marginBottom: setHeight(16),
    fontSize: setText(Constant.defaultFont),
  },
  itemBtm: {
    color: Constant.grayColor,
    fontSize: setText(Constant.defaultFont),
  },
  emptyContainer: {
    height: Constant.ScreenHeight - setHeight(150),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    width: setWidth(288),
    height: setHeight(335),
  },
});
const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Stockin);
