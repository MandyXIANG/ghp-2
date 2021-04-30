import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, FlatList, View, Image, TouchableOpacity, Text } from 'react-native';
import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import Styles from '~/assets/styles/base'

class JobList extends Component {
  static propTypes = {
    jobList: PropTypes.array,
    logPerssFlag: PropTypes.bool,
    workShift: PropTypes.string,
    operatingFlag: PropTypes.bool,
    startFlag: PropTypes.bool,
    refreshing: PropTypes.bool
  }
  static defaultProps = {
    jobList: [],
    logPerssFlag: false, //长按标志
    allCheckFlag: false, //全选标志
    workShift: null, //工作班次
    operatingFlag: false, //操作按钮
    startFlag: false, //开始报工按钮
    refreshing: false
  }
  constructor(props) {
    super(props)
    this.state = {
      imgList: {
        amount: require('../assets/images/amount.png'),
        success: require('../assets/images/success.png'),
        warn: require('../assets/images/warn.png'),
        timeline: require('../assets/images/timeline.png'),
        empty: require('../assets/images/empty.png'),
        check: require('../assets/images/check.png'),
        uncheck: require('../assets/images/uncheck.png')
      },
    }
  }

  render () {
    const { imgList } = this.state
    const { logPerssFlag, jobList, startJob, finishJob, allCheckFlag, allCheck, operatingFlag, startFlag, refresh, refreshing, batchStartJob, batchFinishJob } = this.props
    /**refresh:刷新事件 */
    /**allCheck:全选事件*/
    /**batchStartJob:批量开工事件*/
    /**batchFinishJob:批量报工事件*/
    /**startJob:开工事件 */
    /**finishJob:报工事件 */
    return (
      <View style={styles.warp}>
        <View style={styles.jobList}>
          <FlatList
            onRefresh={() => refresh()}
            data={jobList}
            refreshing={refreshing}
            keyExtractor={(item,index) => index.toString()}
            renderItem={({ item, index }) => this.renderItem(item, index)}
            ListEmptyComponent={() => this.renderEmpty()}
          >
          </FlatList>
        </View>
        {
          logPerssFlag ?
            <View style={styles.footer}>
              {allCheckFlag ?
                /**全选 */
                <TouchableOpacity onPress={() => allCheck(false)}>
                  <Image source={imgList.check} style={styles.checkImage}></Image>
                </TouchableOpacity>
                /**未全选 */
                : <TouchableOpacity onPress={() => allCheck(true)}>
                  <Image source={imgList.uncheck} style={styles.checkImage}></Image>
                </TouchableOpacity>
              }
              < TouchableOpacity onPress={() => batchStartJob()} style={[styles.btnView, styles.btnLeftView]} >
                <Text style={styles.btnViewTitle}>开工</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => batchFinishJob()} style={[styles.btnView, styles.btnRightView]}>
                <Text style={styles.btnViewTitle}>报工</Text>
              </TouchableOpacity>

            </View> : null
        }
        {
          operatingFlag ?
            <View style={styles.footer}>
              {
                startFlag ?
                  < TouchableOpacity onPress={() => startJob()} style={[styles.btnView, { marginHorizontal: setWidth(40) }]} >
                    <Text style={styles.btnViewTitle}>开工</Text>
                  </TouchableOpacity> :
                  <TouchableOpacity onPress={() => finishJob()} style={[styles.btnView, { marginHorizontal: setWidth(40) }]}>
                    <Text style={styles.btnViewTitle}>报工</Text>
                  </TouchableOpacity>
              }

            </View> : null
        }
      </View >
    )
  }

  /**有数据渲染 */
  renderItem (item, index) {
    const { imgList } = this.state
    const { logPerssFlag, workShift, seleteItem, logPress, check } = this.props
    console.log(workShift, 'workShift')
    return (
      <View style={styles.card}>
        {
          logPerssFlag ?
            <View>
              {
                item['check'] ? <TouchableOpacity onPress={() => check(item, false)}>
                  <Image source={imgList.check} style={styles.checkImage}></Image>
                </TouchableOpacity> : <TouchableOpacity onPress={() => check(item, true)}>
                    <Image source={imgList.uncheck} style={styles.checkImage}></Image>
                  </TouchableOpacity>
              }
            </View>
            : null
        }
        <TouchableOpacity style={styles.cardItem} onPress={() => seleteItem(item, index)} onLongPress={() => logPress(item,index)}>
          {/* 高亮 */}
          <View style={item.ishighlight ? styles.highlight : styles.normallight}></View>
          {/* 数量 */}
          <View style={styles.cardAmount}>
            <View style={styles.cardAmoutItem}>
              <Image source={imgList.amount} style={styles.cardAmoutImage}></Image>
              <Text style={styles.cardAmoutText}>{item.input_qty}</Text>
            </View>
            <View style={styles.cardAmoutItem}>
              <Image source={imgList.success} style={styles.cardAmoutImage}></Image>
              <Text style={[styles.cardAmoutText, styles.cardAmountSuccess]}>{item.good_qty}</Text>
            </View>
            <View style={styles.cardAmoutItem}>
              <Image source={imgList.warn} style={styles.cardAmoutImage}></Image>
              <Text style={[styles.cardAmoutText, styles.cardAmountWarn]}>{item.scrap_qty}</Text>
            </View>
          </View>
          {/* 时间 */}
          <View style={styles.cardTime}>
            <Text style={styles.cardTimeTitle}>{item.start_time ? item.start_time.replace(/\d{4}-\d{2}-\d{2}/, '') : null}</Text>
            <Image source={imgList.timeline} style={styles.cardTimeImage}></Image>
            <Text style={styles.cardTimeTitle}>{item.end_time ? item.end_time.replace(/\d{4}-\d{2}-\d{2}/, '') : null}</Text>
          </View>
          {/* 详情 */}
          <View style={styles.cardInfo}>
            <View style={styles.cardInfoItem}>
              <Text style={styles.cardInfoTitle}>批次:</Text>
              <Text style={styles.cardInfoValue}>{item.stage1_dmc}</Text>
            </View>
            <View style={styles.cardInfoItem}>
              <Text style={styles.cardInfoTitle}>小批次:</Text>
              <Text style={styles.cardInfoValue}>{item.stage2_dmc}</Text>
            </View>
            <View>
              <View style={styles.cardInfoPost}>
                <Text style={styles.cardInfoPostTitle}>{workShift}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

    )
  }
  /**无数据渲染 */
  renderEmpty () {
    const { imgList } = this.state
    return (
      <View style={styles.empty}>
        <Image source={imgList.empty} style={styles.noData}></Image>
      </View>
    )
  }

}

//底部固定： 一层层设置flex：1,把固定高度的挤在固定的地方就行。
const styles = StyleSheet.create({
  warp: {
    flex: 1
  },
  jobList: {
    flex: 1,
    height: '100%',
    marginTop: setHeight(20)
  },
  highlight: {
    height: setHeight(5), /**跟设计图不一样(10) */
    backgroundColor: '#ff6470',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5
  },
  normallight: {
    height: setHeight(5), /**跟设计图不一样(10) */
    backgroundColor: '#fff',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkImage: {
    width: setWidth(48),
    height: setWidth(48),
    marginLeft: setWidth(40)
  },
  cardItem: {
    width: setWidth(640),
    height: setHeight(200),
    backgroundColor: '#fff',
    marginHorizontal: setWidth(40),
    marginBottom: setHeight(30),
    borderRadius: 5
  },
  cardAmount: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: setWidth(30),
    marginVertical: setHeight(6),/**跟设计图不一样(24) */
  },
  cardAmoutItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardAmoutImage: {
    width: setWidth(35),
    height: setWidth(35),
  },
  cardAmoutText: {
    fontSize: setText(40),
    paddingLeft: setWidth(16),
    color: '#333'
  },
  cardAmountSuccess: {
    color: '#0080dc'
  },
  cardAmountWarn: {
    color: '#f97062'
  },
  cardTime: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: setWidth(30),
    marginBottom: setHeight(6) /**跟设计图不一样(24) */
  },
  cardTimeTitle: {
    fontSize: setText(28),
    color: '#999'
  },
  cardTimeImage: {
    width: setWidth(310),
    height: setHeight(18)
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: setWidth(15),
    paddingHorizontal: setWidth(15),
    height: setHeight(60),
    backgroundColor: '#f4f8f9',
    borderRadius: 2,
  },
  cardInfoItem: {
    display: 'flex',
    flexDirection: 'row',
  },
  cardInfoTitle: {
    color: '#999',
    fontSize: setText(24),
    paddingRight: setWidth(20)
  },
  cardInfoValue: {
    color: '#999',
    fontSize: setText(24),
  },
  cardInfoPost: {
    height: setHeight(36),
    backgroundColor: '#adb5bc',
    borderRadius: 2
  },
  cardInfoPostTitle: {
    paddingHorizontal: setWidth(10),
    color: '#fff',
    fontSize: setText(24),
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
  },
  noData: {
    width: setWidth(288),
    height: setHeight(330), /**跟设计图不一样(320) */
    marginTop: setHeight(300)
  },
  footer: {
    ...Styles.blue,
    height: setHeight(118),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',

  },
  btnView: {
    flex: 1,
    height: setHeight(88),
    backgroundColor: '#27d6ff',
    borderRadius: 5,
  },
  btnLeftView: {
    marginLeft: setWidth(40),
    marginRight: setWidth(10)
  },
  btnRightView: {
    marginLeft: setWidth(10),
    marginRight: setWidth(40),
  },
  btnViewTitle: {
    marginTop: setHeight(15),
    fontSize: setText(42),
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center'
  }
})

export default JobList