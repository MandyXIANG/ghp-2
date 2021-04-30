import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  StyleSheet,
  ToastAndroid,
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  Text,
  DeviceEventEmitter,
} from 'react-native';
import Header from '../../components/Header';
import LinearGradient from 'react-native-linear-gradient';
import JobList from '../../components/jobList';
import JobInput from '../../components/jobInput';
import {Actions} from 'react-native-router-flux';
import {setHeight, setWidth} from '~/utils/initSize.util';
import Styles from '~/assets/styles/base';
import moment from 'moment';

class JobInformation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logPerssFlag: false, //长按标志
      allCheckFlag: false, //全选标志
      jobList: [],
      item: {}, //选中的某一条数据
      selectFlag: false, //选中某一条数据标志
      firstProcess: [5, 8, 30, 41, 46, 50],
      startConfim: false, //批量开工弹出框标志
      startTime: null, //批量开工的开始时间
      selectList: [], // 选中的数据
      finishConfim: false, //批量报工弹出框标志
      endTime: null, //批量报工的结束时间
      diff_qty: '0', //盈亏数量(差异数量)
      scrap_qty: '0', //不合格数量
      islotend: false, //本批次结束
      refreshing: false, //刷新标志
      indexItem: null, //选中的item的序号
      operatingFlag: false, //显示操作按钮(开工/报工)
      startFlag: false, //显示开工按钮
    };
  }
  componentDidMount() {
    this.initData();
  }

  /**初始化数据 */
  initData = () => {
    const {getJobList, produceTask} = this.props;
    this.setState(
      {
        jobList: [],
        refreshing: true,
        logPerssFlag: false,
        operatingFlag: false,
        startFlag: false,
      },
      () => {
        getJobList({task_id: produceTask.id}).then(
          res => {
            /**判断是否有正在加工中的数据(processing) 如果有就要先报工 */
            const flag = res.data.some(item => {
              return item.status === 'processing';
            });
            const queueingFlag = res.data.some(item => {
              return item.status === 'queueing';
            });
            this.setState({
              jobList: res.data,
              refreshing: false,
              operatingFlag: flag || queueingFlag || false,
              startFlag: !flag,
            });
          },
          err => {
            this.setState({
              refreshing: false,
            });
            ToastAndroid.showWithGravity(
              err.data,
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          },
        );
      },
    );
  };
  /**刷新事件 */
  refresh = () => {
    this.initData();
  };
  /**返回事件 */
  back = () => {
    DeviceEventEmitter.emit('productiontask');
    Actions.pop();
  };

  render() {
    const {
      jobList,
      logPerssFlag,
      allCheckFlag,
      item,
      selectFlag,
      startConfim,
      startTime,
      finishConfim,
      scrap_qty,
      diff_qty,
      islotend,
      endTime,
      refreshing,
      startFlag,
      operatingFlag,
    } = this.state;
    const {workItem, workshift, produceTask} = this.props;
    return (
      <LinearGradient colors={['#00bdf7', '#0084de']} style={styles.container}>
        <Header
          leftTitle={produceTask.prod_order_no}
          leftClick={() => this.back()}
          rightFlag={logPerssFlag}
          rightName={'close'}
          rightClick={() => this.closeBtn()}
        />
        {selectFlag ? (
          <JobInput
            workItem={workItem}
            item={item}
            titleName={'编辑'}
            onChangeText={(value, key) => this.onChangeText(value, key)}
            saveBtn={() => this.saveBtn()}
            closeEdit={() => this.closeEdit()}
            submitRackQty={() => {}}
          />
        ) : (
          <JobList
            startFlag={startFlag}
            operatingFlag={operatingFlag}
            refreshing={refreshing}
            workShift={workshift}
            jobList={jobList}
            logPerssFlag={logPerssFlag}
            allCheckFlag={allCheckFlag}
            logPress={() => this.logPress()}
            seleteItem={(item, index) => this.seleteItem(item, index)}
            startJob={() => this.startJob()}
            finishJob={() => this.finishJob()}
            batchStartJob={() => this.batchStartJob()}
            batchFinishJob={() => this.batchFinishJob()}
            check={(item, flag) => this.check(item, flag)}
            allCheck={flag => this.allCheck(flag)}
            refresh={() => this.refresh()}
          />
        )}

        {/* 批量报工弹出框 */}
        <Modal
          animationType="fade" // 弹出动画效果
          transparent={true} // 背景是否透明
          visible={startConfim} // 决定modle是否显示
          onRequestClose={() => {
            // 手机物理返回  必填
            this.setState({startConfim: !startConfim});
          }}>
          <View style={[styles.modalBg, Styles.columnCenter]}>
            <View style={styles.middleModal}>
              <View style={styles.midalMain}>
                <Text>开工时间</Text>
                <TextInput style={styles.midalInput} value={startTime} />
              </View>
              <View style={styles.midalBtnList}>
                <TouchableOpacity
                  onPress={() =>
                    this.setState({startConfim: !startConfim, selectList: []})
                  }>
                  <Text style={styles.midalBtnView}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.startConfirmBtn()}>
                  <Text style={styles.midalBtnView}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 批量开工弹出框 */}
        <Modal
          animationType="fade" // 弹出动画效果
          transparent={true} // 背景是否透明
          visible={finishConfim} // 决定modle是否显示
          onRequestClose={() => {
            // 手机物理返回  必填
            this.setState({finishConfim: !finishConfim});
          }}>
          <View style={[styles.modalBg, Styles.columnCenter]}>
            <View style={styles.middleFinishModal}>
              <View style={styles.midalFinishMain}>
                <Text>不合格数据</Text>
                <TextInput
                  style={styles.midalInput}
                  value={scrap_qty}
                  keyboardType="numeric"
                  onChangeText={value => {
                    this.setState({scrap_qty: value});
                  }}
                />
                <Text>差异数量</Text>
                <TextInput
                  style={styles.midalInput}
                  value={diff_qty}
                  keyboardType="numeric"
                  onChangeText={value => {
                    this.setState({diff_qty: value});
                  }}
                />
                <Text>报工时间</Text>
                <TextInput
                  style={styles.midalInput}
                  value={endTime}
                  onChangeText={value => {
                    this.setState({endTime: value});
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    this.setState({islotend: !islotend});
                  }}
                  style={
                    islotend
                      ? styles.midalSelectFinishBtn
                      : styles.midalFinishBtn
                  }>
                  <Text style={islotend ? styles.midalFinishTitle : null}>
                    结束本批次
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.midalBtnList}>
                <TouchableOpacity
                  onPress={() =>
                    this.setState({
                      finishConfim: !finishConfim,
                      selectList: [],
                      scrap_qty: '0',
                      diff_qty: '0',
                    })
                  }>
                  <Text style={styles.midalBtnView}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.finishConfirmBtn()}>
                  <Text style={styles.midalBtnView}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  }
  /**关闭编辑界面 */
  closeEdit = () => {
    this.setState({
      selectFlag: false,
    });
  };
  /**选中某个条目 */
  seleteItem = item => {
    /**代表是等待开工 */
    if (item.status === 'queueing') {
      item.start_time = item.now_time;
    } else if (item.status === 'processing') {
      item.end_time = item.now_time;
      item['good_qty'] =
        item['good_qty'] - 0 ? item['good_qty'] : item['input_qty'];
    }
    this.setState({
      selectFlag: true,
      item: item,
    });
  };
  /**批量开工按钮 */
  batchStartJob = () => {
    /**判断状态是否是queueing 并且 批次stage1_dmc 是否一样 */
    const {jobList} = this.state;
    /**先将选中的数据过滤出来 */
    const selectList = jobList.filter(item => {
      return item['check'];
    });
    if (!selectList.length) {
      return ToastAndroid.showWithGravity(
        '请选择需要开工的条目!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    let flag = selectList.every(item => {
      return item.status === 'queueing';
    });
    if (!flag) {
      return ToastAndroid.showWithGravity(
        '所有条目都需未开工!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    const stage1_dmc = selectList[0].stage1_dmc;
    let stage1_dmc_flag = selectList.every(item => {
      return stage1_dmc === item.stage1_dmc;
    });
    if (!stage1_dmc_flag) {
      return ToastAndroid.showWithGravity(
        '所选条目不是同一批次!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    this.setState({
      startConfim: true,
      startTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      selectList: selectList,
    });
  };
  /**批量开工的确认按钮 */
  startConfirmBtn = () => {
    const {startTime, selectList} = this.state;
    const {getStartProcess, workItem, userInfo} = this.props;
    const resumeIds = [];
    selectList.forEach(item => {
      resumeIds.push(item.id);
    });
    getStartProcess({
      workcenter_id: workItem.id,
      start_time: startTime,
      resume_id: resumeIds,
      submit_start: userInfo.username,
    }).then(
      res => {
        if (res.data[0].result === 1) {
          this.setState(
            {
              startConfim: false,
              startTime: null,
              selectList: [],
              allCheckFlag: false,
              logPerssFlag: false,
            },
            () => {
              this.initData();
              ToastAndroid.showWithGravity(
                '批量开工成功!',
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            },
          );
        } else if (res.data[0].result === 0) {
          ToastAndroid.showWithGravity(
            res.data[0].error_info.reason,
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      },
      err => {
        ToastAndroid.showWithGravity(
          err.data,
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      },
    );
  };
  /**批量报工按钮 */
  batchFinishJob = () => {
    /**判断状态是否是processing 并且 批次stage1_dmc 是否一样 */
    const {jobList} = this.state;
    /**先将选中的数据过滤出来 */
    const selectList = jobList.filter(item => {
      return item['check'];
    });
    if (!selectList.length) {
      return ToastAndroid.showWithGravity(
        '请选择需要报工的条目!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    let flag = selectList.every(item => {
      return item.status === 'processing';
    });
    if (!flag) {
      return ToastAndroid.showWithGravity(
        '有挂架未开工或已报工!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    const stage1_dmc = selectList[0].stage1_dmc;
    let stage1_dmc_flag = selectList.every(item => {
      return stage1_dmc === item.stage1_dmc;
    });
    if (!stage1_dmc_flag) {
      return ToastAndroid.showWithGravity(
        '所选条目不是同一批次!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    this.setState({
      finishConfim: true,
      endTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      selectList: selectList,
    });
  };

  /**批量报工的确认按钮 */
  finishConfirmBtn = () => {
    const {selectList, diff_qty, scrap_qty, islotend, endTime} = this.state;
    const {getFinishProcess, workItem, userInfo} = this.props;
    if (scrap_qty - 0 < 0) {
      return ToastAndroid.showWithGravity(
        '不合格的数量值必须为>=0的整数',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    if (!diff_qty) {
      return ToastAndroid.showWithGravity(
        '差异数量值必填',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    if (!endTime) {
      return ToastAndroid.showWithGravity(
        '结束时间必填',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    /**均摊数量 */
    const average_scrap_qty = Math.floor((scrap_qty - 0) / selectList.length);
    const average_diff_qty = Math.floor((diff_qty - 0) / selectList.length);
    const average_scrap_qty_mold = (scrap_qty - 0) % selectList.length;
    const average_diff_qty_mold = (diff_qty - 0) % selectList.length;
    const wip_parts_info = [];
    selectList.forEach((item, index) => {
      if (
        average_scrap_qty_mold !== 0 &&
        average_scrap_qty_mold >= selectList.length - index
      ) {
        item['scrap_qty'] = average_scrap_qty + 1;
      } else {
        item['scrap_qty'] = average_scrap_qty;
      }
      if (
        average_diff_qty_mold !== 0 &&
        average_diff_qty_mold >= selectList.length - index
      ) {
        item['diff_qty'] = average_diff_qty + 1;
      } else {
        item['diff_qty'] = average_diff_qty;
      }
      item['good_qty'] =
        item['input_qty'] - 0 + item['diff_qty'] - item['scrap_qty'];
      item['output_qty'] = item['good_qty'] + item['scrap_qty'];
      wip_parts_info.push({
        resume_id: item.id,
        good_qty: item.good_qty,
        diff_qty: item.diff_qty,
        scrap_qty: item.scrap_qty,
        output_qty: item.output_qty,
        islotend: islotend,
        ishighlight: item.ishighlight,
        modify_site: 'handheld',
      });
    });
    getFinishProcess({
      workcenter_id: workItem.id,
      end_time: endTime, //完工时间
      submit_end: userInfo.username,
      wip_parts_info: wip_parts_info,
    }).then(
      res => {
        if (res.data[0].result === 1) {
          this.setState(
            {
              finishConfim: false,
              endTime: null,
              selectList: [],
              allCheckFlag: false,
              logPerssFlag: false,
            },
            () => {
              this.initData();
              ToastAndroid.showWithGravity(
                '批量报工成功!',
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            },
          );
        } else if (res.data[0].result === 0) {
          ToastAndroid.showWithGravity(
            res.data[0].error_info.reason,
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      },
      err => {
        ToastAndroid.showWithGravity(
          err.data,
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      },
    );
  };

  /**开工按钮 */
  async startJob() {
    // 将开工数据过滤出来
    const {jobList} = this.state;
    const {
      userInfo,
      workItem,
      getSingleStartProcess,
      getEndTime,
      getSingleFinishProcess,
    } = this.props;
    //将开工数据过滤出来
    const filterList = jobList.filter(item => {
      return item.status === 'queueing';
    });
    let flag = true;
    for (let index = 0; index < filterList.length; index++) {
      const item = filterList[index];
      if (item.input_qty - 0 <= 0) {
        ToastAndroid.showWithGravity(
          '入站数量>0',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
        flag = false;
        break;
      }
    }
    if (flag) {
      /**调用开工接口ghp-start_process.js */
      for (let index = 0; index < filterList.length; index++) {
        const item = filterList[index];
        const data = {
          workcenter_id: workItem.id,
          start_time: item.startTime, //必填
          resume_id: [item.id], //报工条目id；非第一工序时传此参数，根据id直接定位报工条目
          ishighlight: item.ishighlight, //非必填
          rack_qty: item.rack_qty, //非必填
          islotend: item.islotend, //非必填
          submit_start: userInfo.username,
        };
        let flag = true;
        await getSingleStartProcess(data).then(
          res => {
            if (res.data[0].result === 0) {
              flag = false;
              ToastAndroid.showWithGravity(
                res.data[0].error_info.reason,
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            }
          },
          err => {
            ToastAndroid.showWithGravity(
              err.data,
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          },
        );
        // 判断是否勾选开工即完工
        if (item['quickly_finish']) {
          let end_time = null;
          await getEndTime({prod_process_id: item.prod_process_id}).then(
            res => {
              end_time = res.data;
            },
          );
          const wip_parts_info = [];
          wip_parts_info.push({
            resume_id: item.id,
            good_qty: item.input_qty,
            diff_qty: 0,
            scrap_qty: 0,
            output_qty: item.input_qty,
            modify_site: 'handheld',
          });
          const data = {
            workcenter_id: workItem.id,
            start_time: item.start_time,
            end_time: end_time, //完工时间
            submit_end: userInfo.username,
            wip_parts_info: wip_parts_info,
          };
          await getSingleFinishProcess(data).then(
            res => {
              if (res.data[0].result === 0) {
                ToastAndroid.showWithGravity(
                  res.data[0].error_info.reason,
                  ToastAndroid.SHORT,
                  ToastAndroid.TOP,
                );
              }
            },
            err => {
              ToastAndroid.showWithGravity(
                err.data,
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            },
          );
        }
        if (index === filterList.length - 1 && flag) {
          /**代表最后一条数据了 */
          this.initData();
          ToastAndroid.showWithGravity(
            '开工成功!',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      }
    }
  }
  /**报工按钮 */
  async finishJob() {
    const {jobList, firstProcess} = this.state;
    const {userInfo, workItem, getSingleFinishProcess} = this.props;
    // 将报工数据过滤出来
    const filterList = jobList.filter(item => {
      return item.status === 'processing';
    });
    let flag = true;
    for (let index = 0; index < filterList.length; index++) {
      const item = filterList[index];
      item.good_qty = item.good_qty - 0 ? item.good_qty : item.input_qty;
      if (
        item.input_qty - 0 + (item.diff_qty - 0) !==
        item.good_qty - 0 + (item.scrap_qty - 0)
      ) {
        ToastAndroid.showWithGravity(
          '数量输入不满足要求:不合格数量+合格数量=盈亏数量+入站数量!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
        flag = false;
        break;
      }
    }
    if (flag) {
      /**调用报工接口 ghp-finish_process.js*/
      let showFlag = true;
      for (let index = 0; index < filterList.length; index++) {
        const item = filterList[index];
        const wip_parts_info = [];
        wip_parts_info.push({
          resume_id: item.id,
          good_qty: item.good_qty,
          diff_qty: item.diff_qty,
          scrap_qty: item.scrap_qty,
          output_qty: item.good_qty - 0 + (item.scrap_qty - 0),
          islotend: item.islotend,
          ishighlight: item.ishighlight,
          rack_qty: item.rack_qty, //挂篮数量，非必填
          modify_site: 'handheld', //固定值，报工方式
        });
        // input_qty: 弹框入站数量, //入站数量，只有第一工序完工才允许传，非第一工序不允许传
        if (firstProcess.includes(workItem.id)) {
          wip_parts_info[0]['input_qty'] = item.input_qty;
        }
        const data = {
          workcenter_id: workItem.id,
          start_time: item.start_time, //开工时间
          end_time: item.end_time ? item.end_time : item.now_time, //完工时间
          submit_end: userInfo.username,
          wip_parts_info: wip_parts_info,
        };
        await getSingleFinishProcess(data).then(
          res => {
            if (res.data[0].result === 0) {
              showFlag = false;
              ToastAndroid.showWithGravity(
                res.data[0].error_info.reason,
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            }
            /**代表最后一条数据了 */
            if (showFlag && index === filterList.length - 1) {
              this.initData();
              ToastAndroid.showWithGravity(
                '报工成功!',
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            }
          },
          err => {
            ToastAndroid.showWithGravity(
              err.data,
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          },
        );
      }
    }
  }

  /**
   * 验证非负整数
   * @param {*} val
   * @returns
   */
  validateNonNegative(val) {
    let reg = /^\d+$/;
    return reg.test(val);
  }
  /**
   * 验证负整数
   * @param {*} val
   * @returns
   */

  validateNegative(val) {
    let reg = /^-[0-9]*[1-9][0-9]*$/;
    return reg.test(val);
  }
  /**保存编辑的数据 */
  saveBtn = () => {
    const {item, firstProcess} = this.state;
    const {workItem, getEditSubmit, userInfo} = this.props;
    if (item.status === 'processing_complete' || item.status === 'processing') {
      if (item.rack_qty - 0 <= 0) {
        return ToastAndroid.showWithGravity(
          '挂篮数量需>0!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (!item.start_time) {
        return ToastAndroid.showWithGravity(
          '开始时间必填!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (!item.end_time) {
        return ToastAndroid.showWithGravity(
          '结束时间必填!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      /**代表第一工序 */
      if (firstProcess.includes(workItem.id)) {
        if (!item.input_qty) {
          return ToastAndroid.showWithGravity(
            '入站数量必填!',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      }
      if (!item.good_qty) {
        return ToastAndroid.showWithGravity(
          '报工数量必填!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (!item.scrap_qty) {
        return ToastAndroid.showWithGravity(
          '不合格数量必填!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (!item.diff_qty) {
        return ToastAndroid.showWithGravity(
          '盈亏数量必填!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (item.diff_qty) {
        if (
          !this.validateNonNegative(item.diff_qty) &&
          !this.validateNegative(item.diff_qty)
        ) {
          return ToastAndroid.showWithGravity(
            '盈亏数量必须为整数，请重新填写!',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      }
      if (item['good_qty'] - 0 < 0) {
        return ToastAndroid.showWithGravity(
          '报工数量不能为负数,请重新填写!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (item['scrap_qty'] - 0 < 0) {
        return ToastAndroid.showWithGravity(
          '不合格数量不能为负数,请重新填写!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (item.good_qty) {
        if (!this.validateNonNegative(item.good_qty)) {
          return ToastAndroid.showWithGravity(
            '报工数量必须为整数，请重新填写!',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      }
      if (item.scrap_qty) {
        if (!this.validateNonNegative(item.scrap_qty)) {
          return ToastAndroid.showWithGravity(
            '不合格数量必须为整数，请重新填写!',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      }
      /**进行check 校验入站数量+盈亏数量=报工数量(合格数量)+不合格数量,若不满足条件,则错误提示框:数量输入不满足要求:不合格数量+合格数量=盈亏数量+入站数量*/
      if (
        item.input_qty - 0 + (item.diff_qty - 0) !==
        item.good_qty - 0 + (item.scrap_qty - 0)
      ) {
        return ToastAndroid.showWithGravity(
          '数量输入不满足要求:不合格数量+合格数量=盈亏数量+入站数量!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      /**完工时间>开工时间 */
      if (
        new Date(item.start_time).getTime() >= new Date(item.end_time).getTime()
      ) {
        return ToastAndroid.showWithGravity(
          '完工时间>开工时间',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      if (item.status === 'processing_complete') {
        /**调用ghp-edit_submit_info.js接口 */
        const data = {
          seq: firstProcess.includes(workItem.id) ? 1 : 2,
          prod_resume_id: item.id,
          start_time: item.start_time,
          end_time: item.end_time,
          ishighlight: item.ishighlight,
          islotend: item.islotend,
          input_qty: item.input_qty,
          good_qty: item.good_qty,
          diff_qty: item.diff_qty,
          scrap_qty: item.scrap_qty,
          process_id: item.prod_process_id,
          rack_qty: item.rack_qty,
          remarks: item.remark,
          modify_person: userInfo.fullname,
          modify_site: 'handheld',
        };
        getEditSubmit(data).then(
          res => {
            if (res.data.result == 1) {
              this.setState(
                {
                  selectFlag: false,
                },
                () => {
                  this.initData();
                  ToastAndroid.showWithGravity(
                    '修改成功!',
                    ToastAndroid.SHORT,
                    ToastAndroid.TOP,
                  );
                },
              );
            } else if (res.data.result === 0) {
              ToastAndroid.showWithGravity(
                res.data.error_info.reason,
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            }
          },
          err => {
            ToastAndroid.showWithGravity(
              err.data,
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          },
        );
      } else {
        this.setState({
          selectFlag: false,
        });
      }
    } else {
      if (item.input_qty <= 0) {
        return ToastAndroid.showWithGravity(
          '入站数量>0',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      this.setState({
        selectFlag: false,
      });
    }
  };
  /**全选中按钮 */
  allCheck = flag => {
    const {jobList} = this.state;
    jobList.map(item => {
      return (item['check'] = flag);
    });
    this.setState({
      jobList: jobList,
      allCheckFlag: flag,
    });
  };
  /**选中某一个按钮 */
  check = (item, flag) => {
    const {jobList} = this.state;
    item['check'] = flag;
    const allCheckFlag = jobList.every(item => {
      return item['check'];
    });
    this.setState({
      jobList: jobList,
      allCheckFlag: allCheckFlag,
    });
  };
  /**长按事件 */
  logPress = () => {
    this.setState({
      logPerssFlag: true,
      operatingFlag: false,
    });
  };
  /**关闭按钮 */
  closeBtn = () => {
    const {jobList} = this.state;
    jobList.map(item => {
      return (item['check'] = false);
    });
    this.setState({
      logPerssFlag: false,
      jobList: jobList,
      allCheckFlag: false,
      operatingFlag: true,
    });
  };

  /**input选中状态 */
  onChangeText(value, key) {
    const {item} = this.state;
    item[key] = value;
    this.setState({
      item: item,
    });
  }
}

const mapStateToProps = state => ({
  userInfo: state.login.userInfo,
});

const mapDispatchToProps = dispatch => ({
  getJobList: dispatch.jobinformation.getJobList,
  getEditSubmit: dispatch.jobinformation.getEditSubmit,
  getStartProcess: dispatch.jobinformation.getStartProcess,
  getFinishProcess: dispatch.jobinformation.getFinishProcess,
  getSingleFinishProcess: dispatch.jobinformation.getSingleFinishProcess,
  getSingleStartProcess: dispatch.jobinformation.getSingleStartProcess,
  getEndTime: dispatch.jobinformation.getEndTime,
});
//底部固定： 一层层设置flex：1,把固定高度的挤在固定的地方就行。
const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(52, 52, 52, 0.2)',
  },
  middleModal: {
    width: setWidth(600),
    backgroundColor: '#fff',
    height: setHeight(380),
    borderRadius: 5,
  },
  midalMain: {
    height: setHeight(280),
    paddingHorizontal: setWidth(40),
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingTop: setHeight(10),
  },
  middleFinishModal: {
    width: setWidth(600),
    backgroundColor: '#fff',
    height: setHeight(780),
    borderRadius: 5,
  },
  midalFinishMain: {
    height: setHeight(680),
    paddingHorizontal: setWidth(40),
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingTop: setHeight(10),
  },
  midalFinishBtn: {
    marginTop: setHeight(20),
    height: setHeight(100),
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  midalSelectFinishBtn: {
    marginTop: setHeight(20),
    height: setHeight(100),
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#27d6ff',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27d6ff',
  },
  midalFinishTitle: {
    color: '#fff',
  },
  midalInput: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  midalBtnList: {
    paddingHorizontal: setWidth(40),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  midalBtnView: {
    color: '#27d6ff',
    paddingTop: setHeight(20),
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(JobInformation);
