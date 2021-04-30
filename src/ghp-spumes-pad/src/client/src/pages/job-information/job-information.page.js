import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, TouchableOpacity, Text, View, Modal, TouchableWithoutFeedback, FlatList, Image, ImageBackground, SafeAreaView, ToastAndroid, TextInput, DeviceEventEmitter } from 'react-native';
import { setHeight, setWidth, setText } from '~/utils/initSize.util';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/AntDesign'
import { Actions } from 'react-native-router-flux';
import Styles from '~/assets/styles/base';
import CheckModal from '../../components/checkModal'
class JobInformation extends Component {
  constructor(props) {
    super(props)
    this.state = {
      visible: false,
      partnumberList: [],//物料数据
      jobList: [],//报工数据
      inspectionList: [], //提审数据
      jobListRefreshing: false,
      startConfim: false,//开工模态框
      selectItem: null,//选中的item //移到store里面去
      finishConfim: false,//报工模态框
      isVisible: false,//是否提审
      checkUser: '',//审核人
      total: 0, //总计
      inspectionList: [],//不良项
      finishCount: '',//完成数量
      jobData: [],// 报工数据
      scrapQtyAll: 0,//不合格数量(报废总数)
      diffQtyAll: 0, //盈亏数量(总差异数量)
      inputQtyAll: 0,// 当前生产入站数量
      swtichPartnumber: "请选择物料编码", //切换时 选中的partnumber
      imageList: {
        empty: require('../../assets/images/empty.png'),
        empty1: require('../../assets/images/empty1.png'),
        card: require('../../assets/images/bg01.png'),
        unReceive: require('../../assets/images/unReceive.png'),
        start: require('../../assets/images/start.png'),
        finish: require('../../assets/images/finish.png'),
      }

    }
  }
  componentDidMount () {
    const { selectLine, workItem, tabName, partnumber, setSelectLine } = this.props
    if (selectLine !== workItem.code) {
      setSelectLine(workItem.code)
      this.initData(true, 'production', "请选择物料编码")
    } else {
      this.initData(true, tabName, partnumber)
    }
    DeviceEventEmitter.addListener("jobinformation", () => {
      const { tabName, partnumber } = this.props
      this.initData(true, tabName, partnumber)
    })
  }
  /**获取物料号 */
  initData (flag, type, partnumber) {
    const { getPartnumberData, workItem, setPartnumber, setTabName } = this.props
    setTabName(type)
    this.setState({
      partnumberList: []
    }, () => {
      getPartnumberData({ workcenter_id: workItem.id, type: type }).then(res => {
        if (res.data.length) {
          /**为true代表是初始化数据获取数据为false代表是打开下拉框时获取数据 */
          if (flag) {
            res.data[0]['check'] = true
            this.setState({
              partnumberList: res.data
            }, () => {
              setPartnumber(partnumber)
              if (partnumber !== '请选择物料编码') {
                this.getListData(partnumber, type)
              }
            })
          } else {
            /**将数据来拿循环 然后将选中的物料号想匹配 如果一样 就将这条数据的check=true */
            for (let i = 0; i < res.data.length; i++) {
              const element = res.data[i];
              if (element.partnumber === partnumber) {
                element['check'] = true
                break
              }
            }
            this.setState({
              visible: true,
              partnumberList: res.data
            })
          }
        } else {
          setPartnumber('请选择物料编码')
          this.setState({
            jobList: []
          })
          if (!flag) {
            this.setState({
              visible: true,
              jobList: []
            })
          }
        }
      })
    })
  }

  /**获取报工数据 */
  getListData = (partnumber, type) => {
    const { workItem, getListData, setPartnumber } = this.props
    this.setState({
      jobList: [],
      jobListRefreshing: true
    }, () => {
      getListData({ workcenter_id: workItem.id, partnumber: partnumber, type: type, isReceive: workItem.isReceive }).then(res => {
        if (res.data.length) {
          this.setState({
            jobList: res.data,
            jobListRefreshing: false
          })
        } else {
          setPartnumber('请选择物料编码')
          this.setState({
            jobListRefreshing: false,
            jobList: res.data
          })
        }
      }, err => {
        this.setState({
          jobListRefreshing: false
        })
      })
    })
  }

  /**返回按钮 */
  back = () => {
    Actions.pop()
    DeviceEventEmitter.emit('post');
  }

  render () {
    const { workItem, tabName, partnumber } = this.props
    const { visible, partnumberList, jobList, jobListRefreshing, startConfim, finishConfim, isVisible, inspectionList, selectItem, checkUser, total, finishCount, scrapQtyAll, diffQtyAll, inputQtyAll } = this.state
    return (
      <LinearGradient colors={["#00bdf7", '#0084de']} style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => this.back()}>
              <Icon name='left' size={setText(48)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{`${workItem.name}_报工`}</Text>
          </View>
          <View style={styles.tabs}>
            <TouchableOpacity style={styles.tab} onPress={() => this.switchTab("production")}>
              <Text style={[styles.tabTitle, tabName === 'production' ? styles.selectTab : null]}>
                生产批次
            </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => this.switchTab("inspection")}>
              <Text style={[styles.tabTitle, tabName === 'inspection' ? styles.selectTab : null]}>
                审核确认
            </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* 下拉框 */}
        <TouchableOpacity onPress={() => this.openModal()}>
          <View style={styles.dropDown}>
            <Text style={styles.placeholder}>{partnumber}</Text>
            <Icon name='down' color="#333" size={setText(36)}></Icon>
          </View>
        </TouchableOpacity>
        {/* 卡片 */}
        <SafeAreaView style={styles.main}>
          {
            tabName === 'production' ?
              <FlatList
                ListEmptyComponent={() => this.listDataEmptyComponent()}
                keyExtractor={(item, index) => index.toString()}
                data={jobList}
                numColumns={3}
                horizontal={false}
                renderItem={({ item, index }) => this.jobListRenderItem(item, index)}
                onRefresh={() => this.reFreshJobList()}
                refreshing={jobListRefreshing}>
              </FlatList> :
              <FlatList
                ListEmptyComponent={() => this.listDataEmptyComponent()}
                keyExtractor={(item, index) => index.toString()}
                data={jobList}
                numColumns={3}
                horizontal={false}
                renderItem={({ item, index }) => this.inspectionListRenderItem(item, index)}
                onRefresh={() => this.reFreshJobList()}
                refreshing={jobListRefreshing}></FlatList>
          }
        </SafeAreaView>
        {/* 物料模态框 */}
        <Modal onRequestClose={() => { this.setState({ visible: !visible }) }} visible={visible} transparent={true} animationType='slide'>
          <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => { this.setState({ visible: false }) }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}></View>
            </TouchableWithoutFeedback>
            <View style={styles.dropDownList}>
              <FlatList ListHeaderComponent={() => this.ListHeaderComponent()}
                ListEmptyComponent={() => this.ListEmptyComponent()}
                keyExtractor={(item, index) => item.partnumber}
                data={partnumberList}
                renderItem={({ item, index }) => this.modelRenderItem(item, index)}>
              </FlatList>
            </View>
          </View>
        </Modal>

        {/* 批量开工模态框 */}
        <Modal
          animationType="fade"// 弹出动画效果
          transparent={true}// 背景是否透明
          visible={startConfim}// 决定modle是否显示
          onRequestClose={() => { // 手机物理返回  必填
            this.setState({ startConfim: !startConfim })
          }}
        >
          <View style={[styles.modalBg, Styles.columnCenter]}>
            <View style={styles.middleModal}>
              <Text style={styles.midalMain}>是否要批量开工?</Text>
              <View style={styles.midalBtnList}>
                <TouchableOpacity onPress={() => this.setState({ startConfim: !startConfim })}>
                  <Text style={styles.midalBtnView}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.startConfirmBtn()}>
                  <Text style={styles.midalBtnView}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 批量报工模块框 */}

        <Modal
          animationType="fade"// 弹出动画效果
          transparent={true}// 背景是否透明
          visible={finishConfim}// 决定modle是否显示
          onRequestClose={() => { // 手机物理返回  必填
            this.setState({ finishConfim: !finishConfim })
          }}
        >
          <View style={[styles.modalBg, Styles.columnCenter]}>
            <View style={styles.middleModal1}>
              <View style={styles.midalMain1}>
                <View style={styles.midalMianTop}>
                  <View style={styles.midalMainLeft}>
                    <Text style={styles.midalMainLeftText}>合格数量</Text>
                    <TextInput keyboardType='numeric' style={styles.midalMainLeftInput} value={finishCount} onChangeText={(value) => this.changeFinishCount(value)}></TextInput>
                  </View>
                  <View style={styles.midalMainRight}>
                    <View style={styles.midalMainRightRow}>
                      <Text style={[styles.midalMainRightCol,{backgroundColor:'#f4f4f4',borderTopLeftRadius:5}]}>当前生产入站</Text>
                      <Text style={[styles.midalMainRightCol, { fontSize: setText(42) }]}>{inputQtyAll}</Text>
                    </View>
                    <View style={styles.midalMainRightRow}>
                      <Text style={[styles.midalMainRightCol,{backgroundColor:'#f4f4f4'}]}>盈亏数量</Text>
                      <Text style={[styles.midalMainRightCol, styles.midalMainRightColQuantity]}>{diffQtyAll}</Text>
                    </View>
                    <View style={styles.midalMainRightRow}>
                      <Text style={[styles.midalMainRightCol,{backgroundColor:'#f4f4f4',borderTopRightRadius:5}]}>不合格数量</Text>
                      <Text style={[styles.midalMainRightCol, styles.midalMainRightColQuantity]}>{scrapQtyAll}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.midalMianBottom}>
                  <Text style={styles.midalMianBottomText}>请确认当前工序已全部清场,报工后工序不可逆</Text>
                </View>

              </View>

              <View style={styles.midalBtnList1}>
                <TouchableOpacity onPress={() => this.setState({ finishConfim: !finishConfim, finishCount: '', inputQtyAll: 0, diffQtyAll: 0, scrapQtyAll: 0 })} style={[styles.midalBtnView1, styles.midalBtnView1Left]}>
                  <Text style={[styles.midalBtnViewText, styles.midalBtnViewLeftText]}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.finishConfirmBtn()} style={[styles.midalBtnView1]}>
                  <Text style={styles.midalBtnViewText}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


        {/* 提审 */}

        <CheckModal
          isVisible={isVisible}
          inspectionList={inspectionList}
          confirmBtn={() => this.confirmBtn()}
          cancelBtn={() => this.cancelBtn()}
          editBtn={() => this.editBtn()}
          changeCheckUser={(value) => this.changeCheckUser(value)}
          total={total}
          isLeft={true}
          checkUser={checkUser}
          username={selectItem ? selectItem.author : null}
          partnumber={selectItem ? selectItem.partnumber : ''}
          lotNo={selectItem ? selectItem.stage1_dmc : ''}></CheckModal>

      </LinearGradient >
    )
  }



  /**tab切换 */
  switchTab = (name) => {
    const { tabName, setTabName, partnumber } = this.props
    const { swtichPartnumber } = this.state
    if (tabName !== name) {
      this.setState({
        jobList: []
      }, async () => {
        setTabName(name)
        await this.initData(true, name, swtichPartnumber)
        this.setState({
          swtichPartnumber: partnumber
        })
      })
    }
  }

  /**下拉框 */

  /**头部的样式 */
  ListHeaderComponent = () => {
    return (
      <View style={styles.dropDownTop}>
        <Text style={styles.dropDownTopLeft}>物料编码</Text>
        <TouchableOpacity onPress={() => { this.affirm() }}>
          <Text style={styles.dropDownTopRight}>确定</Text>
        </TouchableOpacity>
      </View>
    )
  }
  /**数据为空的样式 */
  ListEmptyComponent = () => {
    const { imageList } = this.state
    return (
      <View style={{ alignItems: 'center', marginBottom: setHeight(10) }}>
        <View style={{ width: setWidth(288), height: setHeight(335) }}>
          <Image source={imageList.empty1} style={{ width: '100%', height: '100%' }}></Image>
        </View>
      </View>
    )
  }
  /**渲染数据 */
  modelRenderItem = (item, index) => {
    return (
      <TouchableOpacity onPress={() => this.selectDropDowmItem(index)}>
        <View style={[styles.dropDowmItem, index % 2 != 0 ? styles.dropDowmItemEven : null]}>
          <Text style={[styles.dropDowmTitle, item.check ? styles.dropDownItemSelect : null]}>{item.partnumber}</Text>
          {
            item.check ? <Icon name='check' color="#0080dc" size={setText(36)} /> : null
          }
        </View>
      </TouchableOpacity>
    )
  }

  /**打开模态框 */
  openModal = () => {
    /**调用接口 */
    const { tabName, partnumber } = this.props
    if (partnumber) {
      this.initData(false, tabName, partnumber)
    }
  }

  /**选中批次号 */
  selectDropDowmItem = (index) => {
    const { partnumberList } = this.state
    partnumberList.forEach(element => {
      element['check'] = false
    });
    partnumberList[index]['check'] = true
    this.setState({
      partnumberList: partnumberList
    })
  }

  /**确定按钮 */
  affirm = () => {
    const { setPartnumber, tabName } = this.props
    const { partnumberList } = this.state
    for (let i = 0; i < partnumberList.length; i++) {
      let element = partnumberList[i]
      if (element['check']) {
        this.setState({
          visible: false
        }, () => {
          setPartnumber(element['partnumber'])
          /**调用接口 获取当前物料下的报工数据 */
          this.getListData(element['partnumber'], tabName)
        })
        break
      }
    }
  }


  /**生产批次 */
  /**没有数据时 */
  listDataEmptyComponent = () => {
    const { imageList } = this.state
    return (
      <View style={{ alignItems: 'center', marginTop: setHeight(255) }}>
        <View style={{ width: setWidth(288), height: setHeight(335) }}>
          <Image source={imageList.empty} style={{ width: '100%', height: '100%' }}></Image>
        </View>
      </View>

    )
  }
  /**数据渲染 */
  jobListRenderItem = (item, index) => {
    const { imageList } = this.state
    return (
      <View style={[styles.batchCard, index % 3 !== 0 ? { marginLeft: setWidth(20) } : null]}>
        <ImageBackground style={styles.batchItem} source={imageList.card}>
          <View style={styles.batchCardTop}>
            {/* 左边数据 */}
            <View>
              <Text style={[styles.cardTitle, styles.cardFirstTitle]}>物料号</Text>
              <Text style={styles.cardValue}>{item.partnumber}</Text>
              <Text style={styles.cardTitle}>批次号</Text>
              <Text style={styles.cardValue}>{item.stage1_dmc}</Text>
            </View>
            {/* 右边数据 */}
            <View style={styles.batchCardTopRight}>
              {
                item.status === "queueing" ?
                  <TouchableOpacity onPress={() => this.startProcessBtn(item)}>
                    <Image source={imageList.start} style={styles.cardImage}></Image>
                  </TouchableOpacity>
                  :
                  <TouchableOpacity onPress={() => this.finishProcessBtn(item)}>
                    <Image source={imageList.finish} style={styles.cardImage}></Image>
                  </TouchableOpacity>
              }
            </View>
          </View>
          <View style={[styles.batchCardTop, styles.batchCardBottom]}>
            <Text style={styles.cardBottomTitle}>{item.lot_no}</Text>
            <TouchableOpacity style={styles.cardBtn} onPress={() => this.inspectionBtn(item)}>
              <Text style={styles.cardBtnText}>抽检</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    )
  }
  /**开工按钮 */
  startProcessBtn = (item) => {
    this.setState({
      startConfim: true,
      selectItem: item
    })
  }
  /**开工确认按钮 */
  async startConfirmBtn () {
    const { getProcessData, workItem, getStartProcess, userInfo, partnumber, tabName } = this.props
    const { selectItem } = this.state
    let data = []
    await getProcessData({ workcenter_id: workItem.id, stage1_dmc: selectItem.stage1_dmc, status: 'queueing', isReceive: workItem.isReceive }).then(res => {
      if (res.data.length) {
        res.data.forEach(el => {
          data.push(el.id)
        })
      }
    })
    getStartProcess({
      workcenter_id: workItem.id,
      resume_id: data,
      submit_start: userInfo.username
    }).then(res => {
      if (res.data[0].result == 1) {
        this.setState({
          selectItem: null,
          startConfim: false
        }, () => {
          ToastAndroid.showWithGravity("批量开工成功!", ToastAndroid.SHORT, ToastAndroid.TOP)
          this.getListData(partnumber, tabName)
          // this.initData(true, tabName)
        })
      } else {
        ToastAndroid.showWithGravity(res.data[0].error_info.reason, ToastAndroid.SHORT, ToastAndroid.TOP)
      }
    }, err => {
      ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
    })
  }
  /**完工按钮 */
  finishProcessBtn (item) {
    const { finishCount } = this.state
    const { getProcessData, getEndTimeAndScrapQty, workItem } = this.props
    this.setState({
      selectItem: null,
      jobData: [],
      scrapQtyAll: 0,
      diffQtyAll: 0,
      inputQtyAll: 0
    }, async function () {
      /**获取全部的报工数据 */
      let jobData = []
      await getProcessData({ workcenter_id: workItem.id, stage1_dmc: item.stage1_dmc, status: 'processing', isReceive: workItem.isReceive }).then(res => {
        jobData = res.data
      })
      /**通过第一条报工数据 获取报废总量和完工时间*/
      let scrap_qty_all = 0
      await getEndTimeAndScrapQty({ id: jobData[0].id, partnumber: item.partnumber, lot_no: item.stage1_dmc, start_time: jobData[0].start_time }).then(res => {
        scrap_qty_all = res.data.scrap_qty
      })
      /**获取总入站数量 */
      let input_qty_all = jobData.reduce((total, item) => {
        return total + (item['attr_data']['input_qty'] - 0)
      }, 0)
      /**获取总差异数量 */
      let diff_qty_all = scrap_qty_all + (finishCount - 0) - input_qty_all
      this.setState({
        scrapQtyAll: scrap_qty_all,
        diffQtyAll: diff_qty_all,
        inputQtyAll: input_qty_all,
        selectItem: item,
        jobData: jobData,
        finishConfim: true,
      })
    })
  }
  changeFinishCount = (value) => {
    const { scrapQtyAll, inputQtyAll } = this.state
    const regValue = value.replace(/^(0+)|[^\d]+/g, '')
    let diff_qty_all = scrapQtyAll + (regValue - 0) - inputQtyAll
    this.setState({
      finishCount: regValue,
      diffQtyAll: diff_qty_all
    })
  }

  /**完工确认按钮 */
  async finishConfirmBtn () {
    /**先判断完成数量是否存在 */
    const { finishCount, selectItem, jobData, scrapQtyAll, diffQtyAll, inputQtyAll } = this.state
    const { checkData, getEndTimeAndScrapQty, getFinishProcess, workItem, userInfo, partnumber, tabName } = this.props
    if (!finishCount) {
      return ToastAndroid.showWithGravity("合格数量为空，请确认!", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    if (finishCount > inputQtyAll ) {
      return ToastAndroid.showWithGravity(`合格数量必须小于当前入站数量${inputQtyAll}!`, ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    /**验证是否存在提审未确认数据 */
    let check = 1
    await checkData({ partnumber: selectItem.partnumber, lot_no: selectItem.stage1_dmc }).then(res => {
      check = res.data
    })
    if (check === 0) {
      return ToastAndroid.showWithGravity("该批次存在提审未确认数据,不可完工", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    /**获取全部的报工数据 */
    if (!jobData.length) {
      return ToastAndroid.showWithGravity("未存在报工数据!", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
    /**通过第一条报工数据 获取报废总量和完工时间*/
    let end_time = ''
    await getEndTimeAndScrapQty({ id: jobData[0].id, partnumber: selectItem.partnumber, lot_no: selectItem.stage1_dmc, start_time: jobData[0].start_time }).then(res => {
      end_time = res.data.end_time
    })
    /**均摊不合格数量 */
    const average_scrap_qty = Math.floor(scrapQtyAll / jobData.length)
    const average_scrap_qty_mold = scrapQtyAll % jobData.length
    /**均摊差异数量 */
    const average_diff_qty = Math.floor(diffQtyAll / jobData.length)
    const average_diff_qty_mold = diffQtyAll % jobData.length
    let wip_parts_info = []
    jobData.forEach((item, index) => {
      if (average_scrap_qty_mold !== 0 && average_scrap_qty_mold >= jobData.length - index) {
        item['scrap_qty'] = average_scrap_qty + 1
      } else {
        item['scrap_qty'] = average_scrap_qty
      }
      if (average_diff_qty_mold !== 0 && Math.abs(average_diff_qty_mold) >= jobData.length - index) {
        item['diff_qty'] = average_diff_qty + 1
      } else {
        item['diff_qty'] = average_diff_qty
      }
      item['good_qty'] = (item['attr_data']['input_qty'] - 0) + item['diff_qty'] - item['scrap_qty']
      item['output_qty'] = item['good_qty'] + item['scrap_qty']
      wip_parts_info.push({
        resume_id: item.id,
        good_qty: item.good_qty,
        diff_qty: item.diff_qty,
        scrap_qty: item.scrap_qty,
        output_qty: item.output_qty,
        islotend: false,
        ishighlight: false,
        modify_site: "pad"
      })
    })
    /**批量报工 */
    getFinishProcess({
      workcenter_id: workItem.id,
      end_time: end_time,
      submit_end: userInfo.username,
      wip_parts_info: wip_parts_info
    }).then(res => {
      if (res.data[0].result === 1) {
        this.setState({
          finishConfim: false,
          finishCount: ''
        }, () => {
          ToastAndroid.showWithGravity("批量报工成功!", ToastAndroid.SHORT, ToastAndroid.TOP)
          // this.initData(true, tabName)
          this.getListData(partnumber, tabName)
        })
      } else if (res.data[0].result === 0) {
        ToastAndroid.showWithGravity(res.data[0].error_info.reason, ToastAndroid.SHORT, ToastAndroid.TOP)
      }
    }, err => {
      ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
    })
  }


  /**刷新报工数据 */
  reFreshJobList = () => {
    const { partnumber, tabName } = this.props
    if (partnumber) {
      this.getListData(partnumber, tabName)
    }
  }
  /**抽检按钮 */
  inspectionBtn = (item) => {
    const { workItem } = this.props
    Actions.input({ jobItem: item, workItem: workItem, isEdit: false })
  }
  /**提审确认 */
  /**有数据渲染 */
  inspectionListRenderItem = (item, index) => {
    const { imageList } = this.state
    return (
      <View style={[styles.batchCard, index % 3 !== 0 ? { marginLeft: setWidth(20) } : null]}>
        <ImageBackground style={styles.batchItem} source={imageList.card}>
          <View style={styles.batchCardTop}>
            {/* 左边数据 */}
            <View>
              <Text style={[styles.cardTitle, styles.cardFirstTitle]}>物料号</Text>
              <Text style={styles.cardValue}>{item.partnumber}</Text>
              <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                <View>
                  <Text style={styles.cardTitle}>批次号</Text>
                  <Text style={styles.cardValue}>{item.stage1_dmc}</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>不良总数</Text>
                  <Text style={[styles.cardValue, { color: '#ff4d4d' }]}>{item.scrap_qty}/pcs</Text>
                </View>
              </View>
            </View>
            {/* 右边数据 */}
            <View style={styles.batchCardTopRight}>
              <TouchableOpacity onPress={() => this.checkBtn(item)}>
                <Image source={imageList.unReceive} style={styles.cardImage}></Image>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.batchCardTop, styles.batchCardBottom]}>
            <View style={{ flexDirection: 'row', fontSize: setText(32), color: '#333' }}>
              <Text >检验员:</Text>
              <Text>{item.author}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    )
  }
  /**审核按钮 */
  checkBtn = (item) => {
    const { userInfo } = this.props
    let total = 0
    if (item.result_json_data) {
      total = item.result_json_data.reduce(function (total, item) {
        return total + (item.count - 0)
      }, 0)
    }
    this.setState({
      selectItem: item,
      isVisible: true,
      checkUser: userInfo.fullname,
      total: total,
      inspectionList: item.result_json_data
    })
  }

  /**确定按钮 */
  confirmBtn = () => {
    const { confirmInspection, partnumber, tabName } = this.props
    const { selectItem, checkUser } = this.state
    confirmInspection({
      id: selectItem.id,
      confirm: checkUser
    }).then(res => {
      if (res.data) {
        this.setState({
          checkUser: '',
          selectItem: '',
          isVisible: false
        }, () => {
          ToastAndroid.showWithGravity('提审成功', ToastAndroid.SHORT, ToastAndroid.TOP)
          // this.initData(true, tabName)
          this.getListData(partnumber, tabName)
        })
      }
    }, err => {
      ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
    })

  }
  /**取消按钮 */
  cancelBtn = () => {
    this.setState({
      isVisible: false,
      selectItem: null
    })
  }
  /**修改按钮 */
  editBtn = () => {
    const { workItem } = this.props
    const { selectItem } = this.state
    this.setState({
      isVisible: false
    }, () => {
      Actions.input({ jobItem: selectItem, workItem: workItem, isEdit: true })
    })
  }

  /**修改审核人 */
  changeCheckUser = (value) => {
    this.setState({
      checkUser: value
    })
  }
}

const mapStateToProps = (state) => ({
  userInfo: state.login.userInfo,
  tabName: state.jobinformation.tabName,
  partnumber: state.jobinformation.partnumber,
  selectLine: state.workcenter.selectLine
});

const mapDispatchToProps = (dispatch) => ({
  getPartnumberData: dispatch.jobinformation.getPartnumberData,
  getListData: dispatch.jobinformation.getListData,
  getProcessData: dispatch.jobinformation.getProcessData,
  getStartProcess: dispatch.jobinformation.getStartProcess,
  getFinishProcess: dispatch.jobinformation.getFinishProcess,
  confirmInspection: dispatch.jobinformation.confirmInspection,
  checkData: dispatch.jobinformation.checkData,
  getEndTimeAndScrapQty: dispatch.jobinformation.getEndTimeAndScrapQty,
  getQuantity: dispatch.jobinformation.getQuantity,
  setTabName: dispatch.jobinformation.setTabName,
  setPartnumber: dispatch.jobinformation.setPartnumber,
  setSelectLine: dispatch.workcenter.setSelectLine
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: setWidth(30)
  },
  /**头部 */
  header: {
    /**通过定位居中 */
    position: 'relative',
    paddingTop: setHeight(30),
    height: setHeight(140)
  },
  headerLeft: {
    flexDirection: 'row'
  },
  headerIcon: {
    marginRight: setWidth(20)
  },
  headerTitle: {
    fontSize: setText(42),
    color: '#fff'
  },
  tabs: {
    position: 'absolute',
    left: '50%',
    marginLeft: -setWidth(240),
    width: setWidth(480),
    height: setHeight(78),
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 5,
    flexDirection: 'row',
    marginVertical: setHeight(30),
  },
  tab: {
    flex: 1,
  },
  tabTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: setText(36),
    paddingTop: setHeight(10),
    color: '#fff',
  },
  selectTab: {
    backgroundColor: '#fff',
    color: '#0080dc'
  },
  /**dropDown */
  dropDown: {
    height: setHeight(80),
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: setWidth(30),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: setText(36),
    color: '#333'
  },
  dropDownList: {
    backgroundColor: '#fff',
    height: setHeight(771),
  },
  dropDownTop: {
    height: setHeight(98),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: setWidth(30),
    borderBottomColor: '#eaeaea',
    borderBottomWidth: 1,
  },
  dropDownTopLeft: {
    fontSize: setText(42),
    color: '#333'
  },
  dropDownTopRight: {
    fontSize: setText(42),
    color: '#0080dc'
  },
  dropDowmItem: {
    height: setHeight(86),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: setWidth(30),
  },
  dropDowmTitle: {
    fontSize: setText(36),
    color: '#333'
  },
  dropDowmItemEven: {
    backgroundColor: '#f2f2f2'
  },
  dropDownItemSelect: {
    color: '#0080dc'
  },
  dropDownEmpty: {
    display: 'flex',
    alignItems: 'center',
  },
  /**卡片 */
  main: {
    paddingTop: setHeight(30),
    paddingBottom: setHeight(10),
    flex: 1,
    height: '100%',
    display: 'flex',
  },
  batchCard: {
    height: setHeight(290),
    width: setWidth(600),
    marginBottom: setHeight(20),
  },
  batchItem: {
    height: '100%',
    width: '100%'
  },
  batchCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: setWidth(30)
  },
  batchCardBottom: {
    marginTop: setHeight(35)
  },
  cardTitle: {
    fontSize: setText(28),
    color: '#999999'
  },
  cardFirstTitle: {
    paddingTop: setHeight(10)
  },
  cardValue: {
    fontSize: setText(36),
    color: '#0080dc'
  },
  batchCardTopRight: {
    height: setHeight(180),
    width: setWidth(98)
  },
  cardImage: {
    height: '100%',
    width: '100%'
  },
  cardBottomTitle: {
    fontSize: setText(32),
    color: '#333',
  },
  cardBtn: {
    width: setWidth(100),
    height: setHeight(50),
    borderRadius: 5,
    ...Styles.blue
  },
  cardBtnText: {
    color: '#fff',
    fontSize: setText(32),
    textAlign: 'center'
  },
  /**开始报工模态框 */
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  middleModal: {
    width: setWidth(600),
    backgroundColor: '#fff',
    height: setHeight(280),
    borderRadius: 5
  },
  middleModal1: {
    width: setWidth(1400),
    backgroundColor: '#fff',
    height: setHeight(559),
    borderRadius: 5
  },
  midalMain: {
    height: setHeight(200),
    lineHeight: setHeight(200),
    paddingHorizontal: setWidth(40),
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingTop: setHeight(10),
    textAlign: 'center',
    fontSize: setText(32)
  },
  midalMain1: {
    paddingHorizontal: setWidth(30),
    paddingTop: setHeight(20),
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: setHeight(30),
  },
  midalMianTop: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: setHeight(30)
  },
  midalMainLeft: {
    width: setWidth(380),
    height: setHeight(208),
    borderWidth: 1,
    borderColor: '#0080dc',
    borderRadius: 5,
    marginRight: setWidth(20),
    padding: setWidth(20)
  },
  midalMainLeftText: {
    fontSize: setText(36),
    color: '#0080dc'
  },
  midalMainLeftInput: {
    fontSize: setText(36),
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginTop: setHeight(50)
  },
  midalMainRight: {
    flex: 1,
    height: setHeight(208),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'row',
  },
  midalMainRightRow: {
    flex: 1,
    // backgroundColor:'#f4f4f4',
  },
  midalMainRightCol: {
    height: setHeight(104),
    lineHeight: setHeight(104),
    textAlign: 'center',
    fontSize: setText(36),
    color: '#333'
  },
  midalMainRightColQuantity: {
    color: '#ff4a60',
    fontSize: setText(42)
  },
  midalMianBottom: {
    borderWidth: 1,
    borderColor: '#ff4a60',
    height: setHeight(120),
    borderRadius: 5,
    backgroundColor: '#ffebef',
    justifyContent: 'center',
    alignItems: 'center'
  },
  midalMianBottomText: {
    color: '#ff4a60',
    fontSize: setText(36)
  },
  midalBtnList1: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: setHeight(40)
  },
  midalBtnView1: {
    height: setHeight(80),
    width: setWidth(240),
    borderRadius: 5,
    borderColor: '#0080dc',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  midalBtnView1Left: {
    marginRight: setWidth(30),
    backgroundColor: '#0080dc',
  },
  midalBtnViewText: {
    fontSize: setText(42),
    color: '#0080dc'
  },
  midalBtnViewLeftText: {
    color: '#fff'
  },
  midalTitle: {
    fontSize: setText(42),
    color: '#333'
  },
  midalInput: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginBottom: setHeight(20)
  },
  midalAlarm: {
    color: '#ff4d4d',
    fontSize: setText(24)
  },
  midalBtnList: {
    paddingHorizontal: setWidth(40),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  midalBtnView: {
    color: '#0080dc',
    paddingTop: setHeight(20),
    fontSize: setText(32)
  }
})


export default connect(mapStateToProps, mapDispatchToProps)(JobInformation)