import React, { Component } from 'react';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/AntDesign'
import { Actions } from 'react-native-router-flux'
import { StyleSheet, View, Text, ImageBackground, Image, FlatList, Modal, ActivityIndicator, ToastAndroid, BackHandler, Platform, TouchableOpacity, TouchableWithoutFeedback, DeviceEventEmitter } from 'react-native'
import { setHeight, setWidth, setText } from '~/utils/initSize.util';
import handlerOnceTap from '~/utils/handlerOnceTap.util';


const imageList = {
  bgImage: require('~/assets/images/workCenterBg.png'),
  rightIcon: require('~/assets/images/user.png'),
  baogong: require('~/assets/images/baogong.png'),
  luru: require('~/assets/images/luru.png')
}
class Workcenter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      selectedItem: {},
      workline: [],
      refresh: false,
      workcenterLoading: false,
      lineName: ''
    }
  }
  // 注册
  componentDidMount () {
    const { setSelectedWorkshop, setWorkcenter } = this.props
    setSelectedWorkshop({})
    setWorkcenter([])
    this.getWorkshop()
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onBackHandler)
    }
    DeviceEventEmitter.addListener("workcenter", () => {
      const { selectedWorkshop } = this.props
      this.setState({
        selectedItem:selectedWorkshop
      },()=>{
        this.affirm()
      })
    })
  }

  // 移除
  componentWillUnmount () {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.onBackHandler)
    }
  }
  // 物理返回
  onBackHandler = () => {
    if (Actions.currentScene == 'workcenter') {
      if (this.lastBackPressed && this.lastBackPressed + 2000 >= Date.now()) {
        BackHandler.exitApp()
        return false; // 最近2秒内按过back键，可以退出此应用
      }
      this.lastBackPressed = Date.now();
      ToastAndroid.showWithGravityAndOffset('再按一次退出应用', ToastAndroid.SHORT, ToastAndroid.TOP, 0, 30);
      return true; // 默认行为
    }
  }

  // 选择车间
  selectWorkshop = () => {
    this.setState({ visible: true }),
      this.getWorkshop()
  }

  // 获取车间配置数据
  getWorkshop = () => {
    const { getWorkshop } = this.props
    this.setState({ refresh: true })
    getWorkshop().then(res => {
      console.log('核减',res.data)
      if (res.result) {
        this.setState({
          workline: res.data,
          refresh: false,
          workcenterLoading: false
        })
      }
    }).catch(err => {
      this.setState({ refresh: false })
      ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP);
    })
  }

  // 确认产线
  setSelectedItem = (item) => {
    this.setState({ selectedItem: item })
  }

  affirm = () => {
    const { selectedItem } = this.state
    console.log('选择的产线',selectedItem)
    const { setSelectedWorkshop, getWorkcenter, setWorkcenter,user_id } = this.props
    setSelectedWorkshop(selectedItem)
    this.setState({ visible: false, workcenterLoading: true, lineName: selectedItem.name })
    getWorkcenter({ code: selectedItem.code, type: 'pad' ,user_id:user_id}).then(res => {
      if (res.result) {
        setWorkcenter(res.data)
        this.setState({ workcenterLoading: false })
      }
    }).catch(err => {
      this.setState({ workcenterLoading: false })
      ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP);
    })
  }

  // 工作中心确认
  workCenterItem = (item) => {
    const moudel = item.moudel
    if (moudel === 'input') {
      Actions.input({ workItem: item })
    } else {
      Actions.post({ workItem: item })
    }

  }
  render () {
    let { visible, workline, workcenterLoading, lineName } = this.state
    let { workcenterList, fullname } = this.props
    return (
      <ImageBackground style={styles.bgImage} source={imageList.bgImage}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => { handlerOnceTap(() => Actions.push('person')) }}>
                <Image style={styles.headerLeftImage} source={imageList.rightIcon} />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerLeftUser}>Hi {fullname}</Text>
                <Text style={styles.headerLeftWelcome}>Welcome</Text>
              </View>
            </View>
            <ActivityIndicator animating={workcenterLoading} size={setText(40)} color='#0080dc' />
            <TouchableOpacity style={styles.headerRight} onPress={() => { handlerOnceTap(() => this.selectWorkshop()) }}>
              <View style={styles.headerRight}>
                <Text style={styles.rightText}>{lineName ? lineName : '请选择车间'}</Text>
                <Icon name='down' color="#0080dc" size={setText(36)}></Icon>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.workCenter}>
            {workcenterList.length === 0 ?
              <View style={styles.noData}><Text style={styles.noDataText}>暂无工作中心</Text></View> :
              <FlatList keyExtractor={(item, index) => item.code + index}
                horizontal={true}
                data={workcenterList}
                style={{ flex: 1, flexDirection: 'row' }}
                ItemSeparatorComponent={() => <View style={{ width: setWidth(30) }}></View>}
                renderItem={({ item }) => this.renderItem(item)}>
              </FlatList>
            }
          </View>
        </View>
        {
          <Modal onRequestClose={() => { this.setState({ visible: !visible }) }} visible={visible} transparent={true} animationType='slide'>
            <View style={{ flex: 1 }}>
              <TouchableWithoutFeedback onPress={() => { this.setState({ visible: false }) }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}></View>
              </TouchableWithoutFeedback>
              <View style={styles.workshopList}>
                <FlatList ListHeaderComponent={() => this.ListHeaderComponent()}
                  keyExtractor={(item, index) => item.code}
                  data={workline}
                  renderItem={({ item, index }) => this.modelRenderItem(item, index)}>
                </FlatList>
              </View>
            </View>
          </Modal>
        }
      </ImageBackground>
    )
  }

  ListHeaderComponent () {
    const { refresh } = this.state
    return (
      <View style={styles.workshopListTop}>
        <Text style={styles.workshopListTopLeft}>车间</Text>
        <ActivityIndicator animating={refresh} size={setText(40)} color='#0080dc'></ActivityIndicator>
        <TouchableOpacity onPress={() => { this.affirm() }}>
          <Text style={styles.workshopListTopRight}>确定</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // 工作中心
  renderItem (item) {
    return (
      <TouchableOpacity onPress={() => handlerOnceTap(() => this.workCenterItem(item))}>
        <View style={styles.workCenterItem}>
          <Image style={styles.checkoutImage} source={item.moudel === 'input' ? imageList.luru : imageList.baogong} />
          <Text ellipsizeMode='tail' numberOfLines={2} style={styles.workCenterName}>{item.name}_{item.moudel === 'input' ? '录入' : '报工'}</Text>
          <Text ellipsizeMode='tail' numberOfLines={2} style={styles.workCenterCode}>{item.code}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  // 车间选择
  modelRenderItem (item, index) {
    const { selectedItem } = this.state
    return (
      <TouchableOpacity onPress={() => handlerOnceTap(() => this.setSelectedItem(item))}>
        <View style={index % 2 === 0 ? styles.workshopItem : styles.workshopItemBg}>
          <Text style={selectedItem.code === item.code ? styles.workshopSelectText : styles.workshopText}>{item.name}</Text>
          {selectedItem.code == item.code ? <Icon name='check' color="#0080dc" size={setText(36)} /> : null}
        </View>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    resizeMode: "cover"
  },
  container: {
    flex: 1,
    marginTop: setHeight(400),
    marginBottom: setHeight(60),
    marginLeft: setWidth(30),
    marginRight: setWidth(30),
    backgroundColor: '#fff',
    padding: setHeight(40),
    borderRadius: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: setHeight(42),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerLeftImage: {
    marginRight: setWidth(20),
    width: setWidth(100),
    height: setWidth(100),
  },
  headerLeftUser: {
    color: '#333333',
    fontSize: setText(36),
  },
  headerLeftWelcome: {
    color: '#00bdf7',
    fontSize: setText(42),
    fontWeight: 'bold'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rightText: {
    color: '#0080dc',
    fontSize: setText(36),
    marginRight: setWidth(20)
  },
  workCenter: {
    flex: 1,
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
    color: '#0080dc'
  },
  workCenterItem: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#A0E6FC',
    width: setWidth(860),
    height: setHeight(480),
    alignItems: 'center',
    borderRadius: 10,
  },
  checkoutImage: {
    width: setWidth(128),
    height: setWidth(128),
    marginTop: setHeight(45),
    marginBottom: setHeight(48)
  },
  workCenterName: {
    color: '#333333',
    fontSize: setText(36),
    textAlign: 'center',
    marginBottom: setHeight(16)
  },
  workCenterCode: {
    color: '#999999',
    fontSize: setText(28),
    textAlign: 'center'
  },
  workshopList: {
    maxHeight: setHeight(936),
    minHeight: setHeight(400),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#ffffff'
  },
  workshopItem: {
    height: setHeight(86),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: setWidth(20),
    paddingRight: setWidth(20),
  },
  workshopItemBg: {
    height: setHeight(86),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: setWidth(20),
    paddingRight: setWidth(20),
    backgroundColor: '#f2f2f2'
  },
  workshopText: {
    fontSize: setText(36),
    color: '#333333',
  },
  workshopSelectText: {
    fontSize: setText(36),
    color: '#0080dc',
  },
  workshopListTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: setHeight(96),
    alignItems: 'center',
    paddingLeft: setWidth(20),
    paddingRight: setWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea'
  },
  workshopListTopLeft: {
    fontSize: setText(42),
    color: '#333333'
  },
  workshopListTopRight: {
    fontSize: setText(42),
    color: '#0080dc'
  },
});


const mapStateToProps = (state) => ({
  workcenterList: state.workcenter.workcenterList || [],
  fullname: state.login.userInfo.fullname,
  selectedWorkshop:state.workcenter.selectedWorkshop,
  user_id: state.login.userInfo.user_id
});

const mapDispatchToProps = (dispatch) => ({
  setSelectedWorkshop: dispatch.workcenter.setSelectedWorkshop,
  setWorkcenter: dispatch.workcenter.setWorkcenter,
  getWorkshop: dispatch.workcenter.getWorkshop,
  getWorkcenter: dispatch.workcenter.getWorkcenter
});

export default connect(mapStateToProps, mapDispatchToProps)(Workcenter);
