import React, {Component} from 'react';
import {connect} from 'react-redux';
import Icon from 'react-native-vector-icons/AntDesign';
import {Actions} from 'react-native-router-flux';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
  ToastAndroid,
  BackHandler,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  DeviceEventEmitter,
} from 'react-native';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import handlerOnceTap from '~/utils/handlerOnceTap.util';

const imageList = {
  bgImage: require('~/assets/images/workCenterBg.png'),
  rightIcon: require('~/assets/images/user.png'),
  baogong: require('~/assets/images/baogong.png'),
};
class Workcenter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      selectedItem: {},
      workline: [],
      refresh: false,
      workcenterLoading: false,
      lineName: '',
    };
  }
  // 注册
  componentDidMount() {
    const {setSelectedWorkshop, setWorkcenter} = this.props;
    setSelectedWorkshop({});
    setWorkcenter([]);
    this.getWorkshop();
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onBackHandler);
    }
    DeviceEventEmitter.addListener('workcenter', () => {
      const {selectedWorkshop} = this.props;
      this.setState(
        {
          selectedItem: selectedWorkshop,
        },
        () => {
          this.setSelectedItem(selectedWorkshop);
        },
      );
    });
  }

  // 移除
  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.onBackHandler);
    }
  }
  // 物理返回
  onBackHandler = () => {
    if (Actions.currentScene == 'workcenter') {
      if (this.lastBackPressed && this.lastBackPressed + 2000 >= Date.now()) {
        BackHandler.exitApp();
        return false; // 最近2秒内按过back键，可以退出此应用
      }
      this.lastBackPressed = Date.now();
      ToastAndroid.showWithGravityAndOffset(
        '再按一次退出应用',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        30,
      );
      return true; // 默认行为
    }
  };

  // 选择车间
  selectWorkshop = () => {
    this.setState({visible: true}), this.getWorkshop();
  };

  // 获取车间配置数据
  getWorkshop = () => {
    const {getWorkshop} = this.props;
    this.setState({refresh: true});
    getWorkshop().then(res => {
      if (res.result) {
        console.log('车间', res.data);
        this.setState({
          workline: res.data,
          refresh: false,
          workcenterLoading: false,
        });
      } else {
        ToastAndroid.showWithGravityAndOffset(
          '请求数据失败',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
          0,
          30,
        );
      }
    });
  };

  // 确认产线
  setSelectedItem = item => {
    this.setState({selectedItem: item}, () => {
      this.state.lineName = item.name;
      this.affirm();
    });
  };

  affirm = () => {
    const {selectedItem} = this.state;
    const {
      setSelectedWorkshop,
      getWorkcenter,
      setWorkcenter,
      user_id,
    } = this.props;
    setSelectedWorkshop(selectedItem);
    this.setState({visible: false, workcenterLoading: true});
    console.log('工作中心传参', {
      code: selectedItem.code,
      type: 'handheld',
      user_id: user_id,
    });
    getWorkcenter({
      code: selectedItem.code,
      type: 'handheld',
      user_id: user_id,
    }).then(res => {
      console.log('resresres', res.data);
      if (res.result) {
        setWorkcenter(res.data);
        this.setState({workcenterLoading: false});
      } else {
        ToastAndroid.showWithGravityAndOffset(
          '请求数据失败',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
          0,
          30,
        );
      }
    });
  };

  // 工作中心确认
  workCenterItem = item => {
    const moudel = item.moudel;
    if (moudel.includes('receive')) {
      Actions.receive({workItem: item});
    } else {
      Actions.post({workItem: item});
    }
  };
  render() {
    let {
      visible,
      selectedItem,
      workline,
      workcenterLoading,
      refresh,
      lineName,
    } = this.state;
    let {workcenterList, fullname} = this.props;
    return (
      <ImageBackground style={styles.bgImage} source={imageList.bgImage}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLeftUser}>Hi {fullname}</Text>
              <Text style={styles.headerLeftWelcome}>Welcome</Text>
            </View>
            <View>
              <TouchableOpacity
                onPress={() => {
                  handlerOnceTap(() => Actions.push('person'));
                }}>
                <Image
                  style={styles.headerRightImage}
                  source={imageList.rightIcon}
                />
              </TouchableOpacity>
              <View />
            </View>
          </View>
          <View style={styles.workCenter}>
            <ActivityIndicator
              animating={workcenterLoading}
              size={setText(20)}
              color="#0080dc"
            />
            <TouchableOpacity
              style={styles.selectLineText}
              onPress={() => {
                handlerOnceTap(() => this.selectWorkshop());
              }}>
              <Text style={styles.lineText}>
                {lineName ? lineName : '请选择产线'}
              </Text>
              <Icon name="down" color="#0080dc" size={setText(36)} />
            </TouchableOpacity>
            {workcenterList.length === 0 ? (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>暂无工作中心</Text>
              </View>
            ) : (
              <FlatList
                keyExtractor={(item, index) => index.toString()}
                horizontal={false}
                numColumns={2}
                data={workcenterList}
                style={styles.scrollList}
                ItemSeparatorComponent={() => (
                  <View style={{height: setHeight(20)}} />
                )}
                renderItem={({item, index}) => (
                  <TouchableOpacity
                    key={index + item}
                    onPress={() =>
                      handlerOnceTap(() => this.workCenterItem(item))
                    }>
                    <View
                      style={
                        index % 2 === 0
                          ? styles.workCenterItemEven
                          : styles.workCenterItemOdd
                      }>
                      <Image
                        style={styles.checkoutImage}
                        source={imageList.baogong}
                      />
                      <Text
                        ellipsizeMode="tail"
                        numberOfLines={2}
                        style={styles.workCenterName}>
                        {item.name}
                        {item.name.substr(-3, 3) === '_检验' ? '_收料' : ''}
                      </Text>
                      <Text
                        ellipsizeMode="tail"
                        numberOfLines={2}
                        style={styles.workCenterCode}>
                        {item.code}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
        {
          <Modal
            onRequestClose={() => {
              this.setState({visible: !visible});
            }}
            visible={visible}
            transparent={true}
            animationType="slide">
            <View style={{flex: 1}}>
              <TouchableWithoutFeedback
                onPress={() => {
                  this.setState({visible: false});
                }}>
                <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'}} />
              </TouchableWithoutFeedback>
              <View style={styles.workshopList}>
                {
                  <FlatList
                    keyExtractor={(item, index) => index.toString()}
                    data={workline}
                    renderItem={({item, index}) => (
                      <TouchableOpacity
                        key={item + index}
                        onPress={() =>
                          handlerOnceTap(() => this.setSelectedItem(item))
                        }>
                        <View
                          style={
                            index % 2 === 0
                              ? styles.workshopItem
                              : styles.workshopItemBg
                          }>
                          <Text
                            style={
                              selectedItem.code === item.code
                                ? styles.workshopSelectText
                                : styles.workshopText
                            }>
                            {item.name}
                          </Text>
                          {selectedItem.code == item.code ? (
                            <Icon
                              name="check"
                              color="#0080dc"
                              size={setText(36)}
                            />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                }
              </View>
            </View>
          </Modal>
        }
      </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    marginTop: setHeight(310),
    marginBottom: setHeight(30),
    marginLeft: setWidth(30),
    marginRight: setWidth(30),
  },
  header: {
    height: setHeight(128),
    width: setWidth(660),
    padding: setWidth(40),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerLeftUser: {
    color: '#333333',
    fontSize: setText(30),
  },
  headerLeftWelcome: {
    color: '#00BDF7',
    fontSize: setText(36),
    fontWeight: 'bold',
  },
  headerRightImage: {
    width: setWidth(72),
    height: setWidth(72),
  },
  workCenter: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: setHeight(20),
    borderRadius: 5,
    paddingBottom: setHeight(40),
    paddingLeft: setWidth(40),
    paddingRight: setWidth(40),
  },
  selectLineText: {
    height: setHeight(98),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineText: {
    color: '#0080DC',
    fontSize: setText(36),
  },
  noData: {
    borderWidth: 1,
    borderColor: '#A0E6FC',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  noDataText: {
    fontSize: setText(40),
    color: '#0080dc',
  },
  scrollList: {
    flex: 1,
  },
  workCenterItemOdd: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#A0E6FC',
    width: setWidth(270),
    height: setHeight(270),
    alignItems: 'center',
    borderRadius: 10,
  },
  workCenterItemEven: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#A0E6FC',
    width: setWidth(270),
    height: setHeight(270),
    alignItems: 'center',
    borderRadius: 10,
    marginRight: setWidth(20),
  },
  checkoutImage: {
    width: setWidth(86),
    height: setWidth(86),
    marginTop: setHeight(25),
    marginBottom: setHeight(20),
  },
  workCenterName: {
    color: '#333333',
    fontSize: setText(32),
    marginBottom: setHeight(8),
    textAlign: 'center',
  },
  workCenterCode: {
    color: '#cccccc',
    fontSize: setText(28),
    textAlign: 'center',
  },
  workshopList: {
    maxHeight: setHeight(912),
    minHeight: setHeight(400),
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#ffffff',
  },
  workshopItem: {
    height: setHeight(100),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: setWidth(20),
    paddingRight: setWidth(20),
  },
  workshopItemBg: {
    height: setHeight(100),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: setWidth(20),
    paddingRight: setWidth(20),
    backgroundColor: '#f2f2f2',
  },
  workshopText: {
    fontSize: setText(36),
    color: '#333333',
  },
  workshopSelectText: {
    fontSize: setText(36),
    color: '#0080dc',
  },
});

const mapStateToProps = state => ({
  workcenterList: state.workcenter.workcenterList || [],
  fullname: state.login.userInfo.fullname,
  user_id: state.login.userInfo.user_id,
  selectedWorkshop: state.workcenter.selectedWorkshop,
});

const mapDispatchToProps = dispatch => ({
  setSelectedWorkshop: dispatch.workcenter.setSelectedWorkshop,
  setWorkcenter: dispatch.workcenter.setWorkcenter,
  getWorkshop: dispatch.workcenter.getWorkshop,
  getWorkcenter: dispatch.workcenter.getWorkcenter,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Workcenter);
