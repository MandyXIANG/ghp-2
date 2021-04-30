import React, { Component } from 'react';
import { connect } from 'react-redux';
import Header from '../../components/Header';
import { Container, Text } from 'native-base'
import { StyleSheet, View, FlatList, Image, ToastAndroid, TouchableOpacity, ImageBackground, DeviceEventEmitter } from 'react-native';
import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import { Actions } from 'react-native-router-flux';
import LinearGradient from 'react-native-linear-gradient'
import cardStyle from '../../assets/styles/card'

const receiveImg = {
  emptyImg: require('../../assets/images/empty.png'),
  bgImg: require('../../assets/images/bg01.png'),
  unReceive: require('../../assets/images/unReceive.png'),
}
class Receive extends Component {
  constructor(props) {
    super(props)
    this.state = {
      refreshing: false,
      receiveList: [],
      pageSize: 5, // 每一页的条数
      pageNo: 1, // 第几页
      moreData: true, // 是否显示更多
    }
  }

  componentDidMount () {
    this.getData()
    DeviceEventEmitter.addListener("receive", () => {
      this.getData()
    })
  }

  // 初始化数据
  getData = () => {
    this.setState({receiveList: [], pageNo: 1, moreData: true}, () =>{
      this.getReceiveList(1)
    })
  }

  // 检验工序后加 _收料
  handleValueName (item) {
    const isCheck = item.name.substr(-3, 3)
    if (isCheck === '_检验') {
      return `${item.name}_收料`
    } else {
      return `${item.name}`
    }
  }

  // 获取数据
  getReceiveList = (pageNo) => {
    const { getReceiveList, workItem } = this.props
    const { receiveList, pageSize } = this.state
    this.setState({ refreshing: true }, () => {
      getReceiveList({workcenter_id: workItem.id, process_code_list: workItem.process_code_list, pageSize:pageSize, pageNo: pageNo}).then(res => {
        const resData = res.data
        if(resData.length){
          let arr = receiveList.concat(resData)
          this.setState({ receiveList: arr, refreshing: false, moreData: true })
        }else{
          this.setState({ refreshing: false, moreData: false })
        }
      }).catch(err => {
        this.setState({ refreshing: false, moreData: false})
        ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP);
      })
    })
  }
  

  render () {
    const { workItem } = this.props
    const { receiveList, refreshing } = this.state
    return (
      <Container>
          <LinearGradient colors={["#00bdf7", '#00b3f2']}>
            <Header leftTitle={this.handleValueName(workItem)} leftClick={() => this.back()}></Header>
        </LinearGradient>
        <LinearGradient colors={["#00b1f1", '#0084de']} style={styles.receive}>
          <FlatList
            refreshing={refreshing}
            data={receiveList}
            keyExtractor={(item, index) => item.id}
            renderItem={({ item }) => this.renderItem(item)}
            onRefresh={() => this.getData()}
            ListEmptyComponent={() => this.renderEmpty()}
            onEndReached={() => this.scrollToEnd()}
            onEndReachedThreshold={0.1}
            progressViewOffset={0.1}
            ListFooterComponent={() => this.renderFooter()}
          >
          </FlatList>
        </LinearGradient>
      </Container>
      
    )
  }

  // 有数据的渲染
  renderItem(item) {
    return (
      <TouchableOpacity onPress={() => this.goInfoPage(item)} style={cardStyle.cardItem} key={item.id}>
        <ImageBackground style={cardStyle.bgImg}
          source={receiveImg.bgImg}>
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
                        <Text numberOfLines={1} style={cardStyle.output_qty}>{item.output_qty}</Text>
                  </Text>
                </View>
              </View>
            </View>
            <View style={cardStyle.topRight}>
                <Image style={cardStyle.statusImg} source={receiveImg.unReceive}></Image>
            </View>
          </View>
          <View style={styles.cardBtm}>
              <Text style={[styles.firstBottomValue, styles.btmText]}>{item.prod_order_no}</Text>
              <Text style={styles.btmText}>{item.version}</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    )
  }

  // 无数据的渲染
  renderEmpty () {
    return (
      <View style={cardStyle.empty}>
        <Image source={receiveImg.emptyImg} style={cardStyle.noData}></Image>
      </View>
    )
  }

  // 跳转页面
  goInfoPage (item) {
    Actions.receiveinfo({ receiveItem: item })
  }

  // 尾部
  renderFooter = () => {
    const { receiveList, moreData } = this.state
    if (receiveList.length && receiveList.length >= 5) {
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
     this.getReceiveList(pageNo + 1)
     this.setState({pageNo: pageNo + 1})
    }
  }

  //返回
  back = () => {
    Actions.pop(),
    DeviceEventEmitter.emit('workcenter')
  }

}

const styles = StyleSheet.create({
  receive: {
    flex: 1,
    flexDirection: 'column'
  },
  cardBtm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: setWidth(40),
  },
  firstBottomValue: {
    marginRight: setWidth(70),
  },
  btmText: {
    fontSize: setText(32),
    color: '#333333'
  }
})

const mapStateToProps = (state) => ({

});

const mapDispatchToProps = (dispatch) => ({
  getReceiveList: dispatch.receive.getReceiveList,

});

export default connect(mapStateToProps, mapDispatchToProps)(Receive);