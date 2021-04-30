import React, {Component} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  ToastAndroid,
  DeviceEventEmitter,
} from 'react-native';
import {connect} from 'react-redux';
import Icon from 'react-native-vector-icons/EvilIcons';
import {Actions} from 'react-native-router-flux';
import {map as _map} from 'lodash';

import Http from '~/utils/http';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import {stockinType, stockoutType} from './config';
import * as Constant from '~/config/constants';
import DrawerWareHouse from '~/components/drawerWareHouse';
import IbdLoading from '~/components/ibdLoading';

class Home extends Component {
  lastBackPress = Date.now();
  constructor(props) {
    super(props);
    this.state = {
      menu: [
        {
          title: '入库',
          value: 1,
        },
        {
          title: '出库',
          value: 2,
        },
      ],
      showDrawer: false,
      warehouseList: [],
      stockinData: [],
      stockoutData: [],
      loading: false,
    };
  }

  componentDidMount() {
    this.initPage();
    BackHandler.addEventListener('hardwareBackPress', this.onBackHandler);
    this.backListener = DeviceEventEmitter.addListener('home', () => {
      this.initPage();
    });
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackHandler);
    this.backListener.remove();
  }

  initPage() {
    console.log('主页初始化');
    const {selectWarehouse} = this.props;
    if (Object.keys(selectWarehouse).length) {
      this.getCountByType(selectWarehouse);
    }
    this.getWarehouseList();
  }
  /* *
   * 物理返回
   */
  onBackHandler = () => {
    if (Actions.currentScene == 'login' || Actions.currentScene == 'home') {
      if (this.lastBackPress && this.lastBackPress + 2000 >= Date.now()) {
        //最近2秒内按过back键，可以退出应用。
        BackHandler.exitApp();
        return false;
      }
      this.lastBackPress = Date.now();
      ToastAndroid.showWithGravityAndOffset(
        '再按一次退出应用',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        30,
      );
      return true; //默认行为
    }
  };

  getCountByType(selectWarehouse) {
    this.setState({
      loading: true,
    });
    let params = {
      code: selectWarehouse.code,
      stockinType: _map(stockinType, 'name'),
      stockoutType: _map(stockoutType, 'name'),
    };
    Http.post('/home/getCountByType', params)
      .then(res => {
        if (res.result) {
          this.setState({
            stockinData: (res.data || {}).stockin,
            stockoutData: (res.data || {}).stockout,
            loading: false,
          });
        }
      })
      .catch(err => {
        this.setState({
          loading: false,
        });
      });
  }

  getWarehouseList() {
    Http.get('/home/getWarehouseList').then(res => {
      if (res.result) {
        this.setState({
          warehouseList: res.data,
        });
      }
    });
  }
  /**
   * 关闭侧边栏
   */
  onClose() {
    this.setState({
      showDrawer: false,
    });
  }
  /**
   * 打开侧边栏
   */
  onOpen() {
    this.setState({
      showDrawer: true,
    });
  }
  /**
   * 选择仓库
   * @param {*} item
   */
  onClick(item) {
    const {setWarehouse} = this.props;
    setWarehouse(item);
    this.getCountByType(item);
    this.onClose();
  }
  /**
   * 入库
   * @param {*} item
   */
  stockin(item) {
    const {selectWarehouse} = this.props;
    Actions.push('stockin', {
      routeParams: {
        ...item,
        warehouse_code: selectWarehouse.code,
      },
    });
  }

  /**
   * 出库
   * @param {*} item
   */

  stockout(item) {
    const {selectWarehouse} = this.props;
    Actions.push('stockout', {
      routeParams: {
        ...item,
        warehouse_code: selectWarehouse.code,
      },
    });
  }

  goMine() {
    Actions.push('mine');
  }

  renderItem(item, index) {
    const {stockinData, stockoutData} = this.state;
    return (
      <View key={index} style={styles.menuItem}>
        <View style={styles.menuLeft}>
          {item.value === 1 && (
            <Image
              style={styles.menuIcon}
              source={require('../../assets/images/recive-01.png')}
            />
          )}

          {item.value === 2 && (
            <Image
              style={styles.menuIcon}
              source={require('../../assets/images/stockout-01.png')}
            />
          )}
          <Text style={styles.count}>{item.title}</Text>
        </View>
        <ScrollView
          contentContainerStyle={{alignItems: 'center'}}
          style={styles.list}
          horizontal={true} // 横向滚动
          showsHorizontalScrollIndicator={false}
          snapToInterval={1}
          snapToAlignment="end">
          {item.value === 1 && // 入库
            stockinType.map((ele, index) => {
              return (
                <TouchableOpacity
                  onPress={() => this.stockin(ele)}
                  style={[
                    styles.listItem,
                    {
                      width:
                        stockinType.length === 1
                          ? Constant.ScreenWidth - setWidth(212)
                          : (Constant.ScreenWidth - setWidth(228)) * 0.5,
                    },
                  ]}
                  key={index}>
                  <Image
                    style={[
                      styles.listItemImg,
                      {
                        width:
                          stockinType.length === 1
                            ? setWidth(180)
                            : setWidth(120),
                        height:
                          stockinType.length === 1
                            ? setHeight(180)
                            : setHeight(120),
                      },
                    ]}
                    source={require('../../assets/images/baogong.png')}
                  />
                  <Text style={styles.count}>{ele.text}</Text>
                  <View style={styles.listItemCount}>
                    <Text style={styles.count}>数量</Text>
                    <Text style={styles.count}>
                      {stockinData.length
                        ? stockinData.map(item => {
                            if (item.type === ele.name) {
                              return item.count || 0;
                            } else {
                              return 0;
                            }
                          })
                        : 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

          {item.value === 2 && //出库
            stockoutType.map((ele, index) => {
              return (
                <TouchableOpacity
                  onPress={() => this.stockout(ele)}
                  style={[
                    styles.listItem,
                    {
                      width:
                        stockoutType.length === 1
                          ? Constant.ScreenWidth - setWidth(212)
                          : (Constant.ScreenWidth - setWidth(228)) * 0.5,
                    },
                  ]}
                  key={index}>
                  <Image
                    style={[
                      styles.listItemImg,
                      {
                        width:
                          stockoutType.length === 1
                            ? setWidth(180)
                            : setWidth(120),
                        height:
                          stockoutType.length === 1
                            ? setHeight(180)
                            : setHeight(120),
                      },
                    ]}
                    source={require('../../assets/images/baogong.png')}
                  />
                  <Text style={styles.count}>{ele.text}</Text>
                  <View style={styles.listItemCount}>
                    <Text style={styles.count}>数量</Text>
                    <Text style={styles.count}>
                      {stockoutData.length
                        ? stockoutData.map(item => {
                            if (item.type === ele.name) {
                              return item.count || 0;
                            } else {
                              return 0;
                            }
                          })
                        : 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>
    );
  }
  render() {
    let {menu, showDrawer, warehouseList, loading} = this.state;
    const {selectWarehouse} = this.props;
    return (
      <View style={styles.container}>
        <IbdLoading show={loading} />

        {/* 上面部分 */}
        <View style={styles.header}>
          <Text style={styles.headerText}>仓库管理</Text>
          <TouchableOpacity
            onPress={() => {
              this.goMine();
            }}>
            <Icon size={setText(80)} name="user" />
          </TouchableOpacity>
        </View>
        <View style={styles.topContainer}>
          <ImageBackground
            style={styles.top}
            source={require('../../assets/images/warehousebg-01.png')}>
            <TouchableOpacity
              style={styles.topLeft}
              onPress={() => {
                this.onOpen();
              }}>
              <Image
                style={styles.topLefImg}
                source={require('../../assets/images/warehouselist-01.png')}
              />
              <Text style={styles.warehouse}>
                {selectWarehouse.name || '暂无仓库'}
              </Text>
            </TouchableOpacity>
            <Image
              style={styles.topRgtImg}
              source={require('../../assets/images/warehouselogo-01.png')}
            />
          </ImageBackground>
        </View>
        {/* 下面部分 */}
        <View style={styles.btmContainer}>
          {menu.map((ele, index) => {
            return this.renderItem(ele, index);
          })}
        </View>
        {/* 侧边栏 */}

        {showDrawer && (
          <DrawerWareHouse
            data={warehouseList}
            onClose={() => {
              this.onClose();
            }}
            onClick={ele => {
              this.onClick(ele);
            }}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: setHeight(80),
    padding: setWidth(16),
  },
  headerText: {
    fontSize: setText(Constant.lgFont),
  },
  topContainer: {
    padding: setWidth(16),
    paddingTop: 0,
  },
  top: {
    width: '100%',
    borderRadius: setWidth(10),
    height: setHeight(230),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: setHeight(30),
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: setWidth(20),
  },
  topLefImg: {
    width: setWidth(60),
    height: setHeight(60),
    marginRight: setWidth(10),
  },
  warehouse: {
    fontSize: setText(Constant.defaultFont),
    color: '#fff',
  },
  topRgtImg: {
    width: setWidth(160),
    height: setHeight(160),
    marginRight: setWidth(50),
  },
  btmContainer: {
    flex: 1,
  },
  menuItem: {
    width: '100%',
    height: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#ccc',
    borderTopWidth: 1,
  },
  menuLeft: {
    width: setWidth(180),
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightColor: '#ccc',
    borderRightWidth: 1,
  },
  menuIcon: {
    width: setWidth(100),
    height: setHeight(100),
  },
  list: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    paddingRight: setWidth(16),
  },
  listItem: {
    width: (Constant.ScreenWidth - setWidth(228)) * 0.5,
    height: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: setWidth(16),
    overflow: 'hidden',
  },
  listItemImg: {
    width: setWidth(120),
    height: setHeight(120),
    marginBottom: setHeight(16),
  },
  listItemCount: {
    flexDirection: 'row',
  },
  count: {
    fontSize: setText(Constant.defaultFont),
  },
});

const mapStateToProps = state => ({
  selectWarehouse: state.home.selectWarehouse,
});

const mapDispatchToProps = dispatch => ({
  setWarehouse: dispatch.home.setWarehouse,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Home);
