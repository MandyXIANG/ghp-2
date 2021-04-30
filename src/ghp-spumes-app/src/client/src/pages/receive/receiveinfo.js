import React, { Component } from 'react';
import { connect } from 'react-redux';
import Header from '../../components/Header';
import { Container, Text } from 'native-base'
import { StyleSheet, View, FlatList, Image, ToastAndroid, TouchableOpacity, ImageBackground, DeviceEventEmitter } from 'react-native';
import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import { Actions } from 'react-native-router-flux';
import LinearGradient from 'react-native-linear-gradient'
import cardStyle from '../../assets/styles/card'
import Styles from '~/assets/styles/base'

const receiveInfoImg = {
  emptyImg: require('../../assets/images/empty.png'),
  bgImg: require('../../assets/images/receiveCard.png'),
  checked: require('../../assets/images/check.png'),
  uncheck: require('../../assets/images/uncheck.png'),
}
class ReceiveInfo extends Component {
  constructor(props) {
    super(props)
    this.state = {
      refreshing: false,
      receiveDetailList: [],
      allCheckFlag: false, // 是否全选
      logPerssFlag: false, // 是否长按
    }
  }

  componentDidMount () {
    this.getData()
  }

  // 获取数据
  getData (value) {
    const { getReceiveDetail, receiveItem } = this.props
    this.setState({ receiveDetailList: [], refreshing: true }, () => {
      getReceiveDetail({id: receiveItem.id }).then(res => {
        const resData = res.data
        if (resData) {
          this.setState({ receiveDetailList: resData, refreshing: false }, () => {
            if (!resData.length) {
              this.back()
            } else {
              if (value !== 'submit') { // 判断是否来自收料确认提交
                this.setState({
                  logPerssFlag: false,
                  allCheckFlag: false
                })
              } else {
                this.setState({
                  logPerssFlag: true,
                  allCheckFlag: false
                })
              }
            }
          })
        }
      }).catch(err => {
        ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP);
      })
    })
    
  }

  // 长按可勾选
  logPress = () => {
    this.setState({
      logPerssFlag: true,
    })
  }


  // 是否选中此Item
  isCheckItem = (item, flag) => {
    const { receiveDetailList } = this.state
    item['isChecked'] = flag
    const allCheckFlag = receiveDetailList.every(item => {
      return item['isChecked']
    })
    this.setState({
      receiveDetailList: receiveDetailList,
      allCheckFlag: allCheckFlag
    })
  }

  // 是否全选
  isCheckAll = (val) => {
    const { receiveDetailList } = this.state
    receiveDetailList.map(k => {
      return k['isChecked'] = val
    })
    this.setState({
      receiveDetailList: receiveDetailList,
      allCheckFlag: val
    })
  }

  // 是否关闭
  closeBtn = () => {
    const { receiveDetailList } = this.state
    receiveDetailList.map(k => {
      return k['isChecked'] = false
    })
    this.setState({
      receiveDetailList: receiveDetailList,
      logPerssFlag: false,
      allCheckFlag: false
    })
  }

  // 收料确认
  receiveAll (value) {
    const { updateReceive } = this.props
    const { receiveDetailList } = this.state
    const selectedArr = receiveDetailList.filter(item => {
      return item['isChecked']
    })
    if (!selectedArr.length) {
      return ToastAndroid.showWithGravity("请选择需要收料的条目!", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    const ids = selectedArr.map(k => k.id)
    updateReceive({ids: ids}).then(res => {
      if (res.data) {
        ToastAndroid.showWithGravity("批量收料成功!", ToastAndroid.SHORT, ToastAndroid.TOP)
         this.getData(value)
      }
    }).catch(err => {
      ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
    })
  }

  

  render () {
    const { receiveItem } = this.props
    const { receiveDetailList, refreshing, logPerssFlag, allCheckFlag } = this.state
    return (
      <Container>
          <LinearGradient colors={["#00bdf7", '#00b3f2']}>
            <Header leftTitle={receiveItem.prod_order_no} leftClick={() => this.back()}
                    rightFlag={logPerssFlag} rightName={'close'} rightClick={() => this.closeBtn()}></Header>
        </LinearGradient>
        <LinearGradient colors={["#00b1f1", '#0084de']} style={styles.receiveInfo}>
          <FlatList
            refreshing={refreshing}
            data={receiveDetailList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => this.renderItem(item)}
            onRefresh={() => this.getData()}
            ListEmptyComponent={() => this.renderEmpty()}>
          </FlatList>
          {
            logPerssFlag ? // 判断是否展示底部
            <View style={styles.infofooter}>
              {
                allCheckFlag ? // 判断是否全选
                <TouchableOpacity onPress={() => this.isCheckAll(false)}>
                  <Image source={receiveInfoImg.checked} style={styles.checkImage}></Image>
                </TouchableOpacity> :
                <TouchableOpacity onPress={() => this.isCheckAll(true)}>
                <Image source={receiveInfoImg.uncheck} style={styles.checkImage}></Image>
              </TouchableOpacity>
              }
              <TouchableOpacity onPress={() => this.receiveAll('submit')} style={styles.footerBtm}>
                <Text style={styles.btnViewTitle}>收料</Text>
              </TouchableOpacity>
            </View>
            :
            null
          }
        </LinearGradient>
      </Container>
      
    )
  }

  // 有数据的渲染
  renderItem(item) {
    const { logPerssFlag } = this.props
    return (
      <View style={styles.card}>
        {this.state.logPerssFlag ?
            (<View>
              {
                item['isChecked'] ?
                  <TouchableOpacity onPress={() => this.isCheckItem(item, false)}>
                      <Image source={receiveInfoImg.checked} style={styles.checkImage}></Image>
                  </TouchableOpacity>
                  :
                  <TouchableOpacity onPress={() => this.isCheckItem(item, true)}>
                    <Image source={receiveInfoImg.uncheck} style={styles.checkImage}></Image>
                  </TouchableOpacity>
              }
            </View>) :
          null
        }
          <TouchableOpacity style={styles.cardItem} onLongPress={() => this.logPress(item)}>
              <ImageBackground style={{ flex: 1 }} source={receiveInfoImg.bgImg}>
                  <View style={cardStyle.cardTop}>
                    <View style={cardStyle.topLeft}>
                      <View style={cardStyle.firstLine}>
                        <Text style={cardStyle.formTitle} numberOfLines={1}>物料编码</Text>
                        <Text style={cardStyle.formDesc} numberOfLines={1}>{item.partnumber}</Text>
                      </View>
                      <View>
                        <View style={cardStyle.left}>
                          <Text style={cardStyle.formTitle}>计划产量 / 实际产量</Text>
                          <Text numberOfLines={1}>
                                <Text style={cardStyle.input_qty}>{item.input_qty} / </Text>
                                <Text numberOfLines={1} style={cardStyle.output_qty}>0</Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardBtm}>
                    <View style={styles.bottomItem}>
                        <Text style={styles.bottomValue}>批号:</Text>
                        <Text style={styles.bottomValue}>{item.stage1_dmc}</Text>
                    </View>
                    <View style={styles.bottomItem}>
                        <Text style={styles.bottomValue}>小批号:</Text>
                        <Text style={styles.bottomValue}>{item.stage2_dmc}</Text>
                    </View>
                    <View style={styles.bottomItem}>
                        <Text style={styles.bottomReceive}>未收料</Text>
                    </View>
                  </View>
              </ImageBackground>
          </TouchableOpacity>
      </View>
    )
  }

  // 无数据的渲染
  renderEmpty () {
    return (
      <View style={cardStyle.empty}>
        <Image source={receiveInfoImg.emptyImg} style={cardStyle.noData}></Image>
      </View>
    )
  }

  //返回
  back = () => {
    Actions.popTo('receive')
    DeviceEventEmitter.emit('receive');
  }
}

const styles = StyleSheet.create({
  receiveInfo: {
    flex: 1,
    flexDirection: 'column'
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardItem: {
    width: setWidth(640),
    height: setHeight(320),
    marginHorizontal: setWidth(40),
    marginBottom: setHeight(25),
  },
  cardBtm: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: setWidth(30),
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  infofooter: {
    ...Styles.blue,
    height: setHeight(118),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bottomItem: {
    flexDirection: 'row'
  },
  bottomValue: {
    color: '#999999',
    fontSize: setText(24)
  },
  bottomReceive: {
    width: setWidth(80),
    height: setHeight(36),
    color: '#ffffff',
    fontSize: setText(24),
    backgroundColor: '#adb5bc',
    borderRadius: 5,
    textAlign: 'center'
  },
  checkImage: {
    width: setWidth(48),
    height: setWidth(48),
    marginLeft: setWidth(40)
  },
  footerBtm: {
    flex: 1,
    height: setHeight(88),
    backgroundColor: '#27d6ff',
    borderRadius: 5,
    marginHorizontal: setWidth(40)
  },
  btnViewTitle: {
    marginTop: setHeight(15),
    fontSize: setText(42),
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center'
  }
})

const mapStateToProps = (state) => ({

});

const mapDispatchToProps = (dispatch) => ({
  getReceiveDetail: dispatch.receive.getReceiveDetail,
  updateReceive: dispatch.receive.updateReceive,

});

export default connect(mapStateToProps, mapDispatchToProps)(ReceiveInfo);