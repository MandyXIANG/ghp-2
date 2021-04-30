import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Container, Text } from 'native-base';
import { StyleSheet, View, FlatList, Image, ToastAndroid, TouchableOpacity, ImageBackground, DeviceEventEmitter } from 'react-native';
import Header from '../../components/Header';
import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import { Actions } from 'react-native-router-flux';
import LinearGradient from 'react-native-linear-gradient'
import cardStyle from '../../assets/styles/card'
import Pylon from '../job-information/pylon.page'

const taskImg = {
  emptyImg: require('../../assets/images/empty.png'),
  bgImg: require('../../assets/images/bg01.png'),
  processing: require('../../assets/images/processing.png'),
  blocked: require('../../assets/images/blocked.png'),
  paused: require('../../assets/images/paused.png')
}

class ProductionTask extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
      taskList: [], // 列表数据
      flag: true,
      pageSize: 5, // 每一页的条数
      pageNo: 1, // 第几页
      moreData: true, // 是否显示更多
      setTabsColor: {
        leftColor: '#ffffff',
        leftBgColor: '#27d6ff',
        rightColor: '#333333',
        rightBgColor: '#ffffff',
      },
      tabList: [
        { label: '生产任务', value: 'process' },
        { label: '挂架报工', value: 'rack' }
      ]
    }
  }

  componentDidMount () {
    const { workItem } = this.props
    const typeMsg = workItem.show_tab
    if (typeMsg.includes('process')) {
      this.initData()
    }else{
      this.setState({
        flag:false
      })
    }
  }
  // 初始化数据
  initData = () => {
    this.setState({taskList: [], pageNo: 1, moreData: true}, () =>{
      this.getProductData(1)
    })
    DeviceEventEmitter.addListener("productiontask",()=>{
      this.setState({taskList: [], pageNo: 1, moreData: true}, () =>{
        this.getProductData(1)
      })
    })
  }

  // 获取数据
  getProductData = (pageNo) => {
    const { getProductData, workItem } = this.props
    const { taskList, pageSize } = this.state
    this.setState({ refreshing: true }, () => {
      getProductData({ process_code_list: workItem.process_code_list, workcenter_id: workItem.id, pageSize:pageSize, pageNo: pageNo }).then(res => {
        const resData = res.data
        if(resData.length){
          let arr = taskList.concat(resData)
          this.setState({ taskList: arr, refreshing: false, moreData: true })
        }else{
          this.setState({ refreshing: false, moreData: false })
        }
      }).catch(err => {
        ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP);
        this.setState({ refreshing: false, moreData: false })
      })
    })
  }

  // 生产任务数据
  changeTitleMsg = (item) => {
    if (item.value === 'process') { // 修改tab样式
      this.setState({
        flag: true,
        setTabsColor: {
          leftColor: '#ffffff',
          leftBgColor: '#27d6ff',
          rightColor: '#333333',
          rightBgColor: '#ffffff',
        }
      }, () => {
        this.initData()
      })
    } else {
      this.setState({
        flag: false,
        taskList: [],
        setTabsColor: {
          leftColor: '#333333',
          leftBgColor: '#ffffff',
          rightColor: '#ffffff',
          rightBgColor: '#27d6ff',
        }
      })
    }
  }

  // 跳转信息页面
  goInfoPage (item) {
    const { workItem, workshift } = this.props
    Actions.jobinformation({ produceTask: item, workItem: workItem, workshift: workshift })
  }

  // 尾部
  renderFooter = () => {
    const { taskList, moreData } = this.state
    if (taskList.length && taskList.length >= 5) {
      if (moreData) {
        return (
          <View style={cardStyle.footContainer}>
            <Text style={cardStyle.footerText}>上拉加载更多...</Text>
          </View>
        )
      } else {
        return (
          <View style={cardStyle.footContainer}>
            <Text style={cardStyle.footerText}>人家是有底线的~</Text>
          </View>
        )
      }
    } else {
      return null
    }
  }

  // 上拉加载
  scrollToEnd = () => {
    let {pageNo, moreData } = this.state
    if (moreData) {
     this.getProductData(pageNo + 1)
     this.setState({pageNo: pageNo + 1})
    }
  }

  // 返回上一页
  back = () => {
    Actions.popTo('post')
    DeviceEventEmitter.emit('post')
  }

  render () {
    const { workItem, workshift } = this.props
    const { tabList, refreshing, taskList, flag } = this.state
    return (
      <Container>
        <LinearGradient colors={["#00bdf7", '#00b3f2']} >
          <Header leftTitle={workItem.name} leftClick={() => this.back()} ></Header>
          {workItem.show_tab.length === 2 ? (
            // 展示生产任务和挂架报工tab
            <View style={styles.btnList}>
              {
                tabList.map((item, index) => {
                  return (
                    <TouchableOpacity key={index + ''} onPress={() => { this.changeTitleMsg(item) }}  >
                      { item.value === 'process' &&
                        <Text style={[styles.btnText, styles.leftTitle,
                        { color: this.state.setTabsColor.leftColor, backgroundColor: this.state.setTabsColor.leftBgColor }]}>
                          {item.label}
                        </Text>
                      }
                      { item.value === 'rack' &&
                        <Text style={[styles.btnText, styles.rightTitle,
                        { color: this.state.setTabsColor.rightColor, backgroundColor: this.state.setTabsColor.rightBgColor }]}>
                          {item.label}
                        </Text>
                      }
                    </TouchableOpacity>
                  )
                })
              }
            </View>) : null
          }

        </LinearGradient>
        <LinearGradient colors={["#00b1f1", '#0084de']} style={styles.productTask}>
          {flag ?
            <FlatList
              refreshing={refreshing}
              onRefresh={() => this.initData()}
              data={taskList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => this.renderItem(item)}
              ListEmptyComponent={() => this.renderEmpty()}
              onEndReachedThreshold={0.1}
              progressViewOffset={0.1}
              onEndReached={() => this.scrollToEnd()}
              ListFooterComponent={() => this.renderFooter()}>
            </FlatList>
            :
            <Pylon workItem={workItem} workshift={workshift}></Pylon>
          }
        </LinearGradient>
      </Container>
    )
  }

  /**有数据 */
  renderItem (item) {
    return (
      <TouchableOpacity onPress={() => this.goInfoPage(item)} style={cardStyle.cardItem} key={item.id}>
        <ImageBackground style={cardStyle.bgImg}
          source={taskImg.bgImg}>
          <View style={cardStyle.cardTop}>
            <View style={cardStyle.topLeft}>
              <View>
                <Text style={cardStyle.formTitle} numberOfLines={1}>物料编码</Text>
                <Text style={cardStyle.formDesc} numberOfLines={1}>{item.partnumber}</Text>
              </View>
              <View>
                <View style={cardStyle.left}>
                  <Text style={cardStyle.formTitle}>计划产量 / 实际产量</Text>
                  <Text numberOfLines={1}>
                    <Text style={cardStyle.input_qty}>{item.input_qty} / </Text>
                    <Text numberOfLines={1} style={cardStyle.output_qty}>{item.output_qty}</Text>
                  </Text>
                </View>
              </View>
            </View>
            <View style={cardStyle.topRight}>
              {
                item.status === "processing" && <Image style={cardStyle.statusImg} source={taskImg.processing}></Image>
              }
              {
                item.status === 'blocked' && <Image style={cardStyle.statusImg} source={taskImg.blocked}></Image>
              }
              {
                item.status === 'paused' && <Image style={cardStyle.statusImg} source={taskImg.paused}></Image>
              }
            </View>
          </View>
          <View style={cardStyle.cardBtm}>
            <View>
              <Text style={cardStyle.firstBottomValue}>{item.prod_order_no}</Text>
            </View>
            <View>
              <Text style={cardStyle.firstBottomValue}>{item.version}</Text>
            </View>
            <View style={cardStyle.bottomItem}>
              <Text style={[cardStyle.productValue, { backgroundColor: '#0080dc', marginRight: setWidth(20) }]}>{item.prod_status ? '报' : ''}</Text>
              {item.priority === '高' && <Text style={[cardStyle.productValue, { backgroundColor: '#ff6470' }]}>高</Text>}
              {item.priority === '中' && <Text style={[cardStyle.productValue, { backgroundColor: '#f7931e' }]}>中</Text>}
              {item.priority === '低' && <Text style={[cardStyle.productValue, { backgroundColor: '#c9d0e2' }]}>低</Text>}
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    )
  }

  /**没有数据的渲染 */
  renderEmpty () {
    return (
      <View style={cardStyle.empty}>
        <Image source={taskImg.emptyImg} style={cardStyle.noData}></Image>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  btnList: {
    marginTop: setHeight(10),
    marginBottom: setHeight(30),
    marginHorizontal: setWidth(36),
    flexDirection: 'row',
    height: setHeight(85),
    backgroundColor: '#ffffff',
    borderRadius: 5
  },
  btnText: {
    width: setWidth(320),
    height: setHeight(86),
    fontSize: setText(36),
    lineHeight: setHeight(86),
    textAlign: 'center',
  },
  leftTitle: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5
  },
  rightTitle: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  productTask: {
    flex: 1,
    flexDirection: 'column'
  },
  footContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: setHeight(20)
  },
  footerText: {
    fontSize: setText(28),
    color: 'rgba(255, 255, 255, 0.8)'
  }
})

const mapStateToProps = (state) => ({

});

const mapDispatchToProps = (dispatch) => ({
  getProductData: dispatch.productiontask.getProductData,
})

export default connect(mapStateToProps, mapDispatchToProps)(ProductionTask);