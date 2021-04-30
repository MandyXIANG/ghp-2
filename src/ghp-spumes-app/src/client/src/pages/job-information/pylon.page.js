import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  Modal,
  Text,
} from 'react-native';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import Icon from 'react-native-vector-icons/AntDesign';
import {connect} from 'react-redux';
import JobList from '../../components/jobList';
import JobInput from '../../components/jobInput';
import Styles from '~/assets/styles/base';
class Pylon extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchValue: '',
      jobList: [],
      operatingFlag: false,
      startFlag: false,
      firstProcess: [5, 8, 30, 41, 46, 50],
      queueingList: [], //等待开工数据
      processingList: [], //正在加工的数据
      enterFlag: false, //搜索框是否搜索
      addFlag: false, //新增按钮是否触发
      item: {}, //编辑的item 数据
      titleName: '新建', //标题
      barCode: '', //搜索二维码
      refreshing: false, //下拉刷新
      deleteConfirm: false, //删除确认
      indexItem: null, //选中的item的序号
      rackCount: 0, // 搜索的时候 返回的挂篮数量
      autoFocus: false, //搜索时自动聚焦
    };
  }
  render() {
    const {
      searchValue,
      jobList,
      operatingFlag,
      startFlag,
      addFlag,
      item,
      titleName,
      barCode,
      refreshing,
      deleteConfirm,
      autoFocus,
    } = this.state;
    const {workItem, workshift} = this.props;
    return (
      <View style={styles.container}>
        <View style={styles.search}>
          <TextInput
            style={styles.searchInput}
            autoFocus={true}
            placeholder={'这是一个小批号'}
            value={searchValue}
            onChangeText={value => this.onChangeText(value)}
            onSubmitEditing={() => {
              this.submitSearchValue();
            }}
          />
          <TouchableOpacity onPress={() => this.addBtn()}>
            <View style={styles.searchBtn}>
              <Icon size={setText(36)} name="plus" color={'#333'} />
            </View>
          </TouchableOpacity>
        </View>
        {addFlag ? (
          <JobInput
            workItem={workItem}
            stageFlag={true}
            barCode={barCode}
            item={item}
            titleName={titleName}
            // onChangeText={(value, key) => this.onChangeText(value, key)}
            saveBtn={() => this.saveBtn()}
            closeEdit={() => this.closeEdit()}
            submitBarcodeValue={() => this.submitBarcodeValue()}
            onChangeText={(value, key) => this.onChangeInputText(value, key)}
            submitRackQty={() => this.submitRackQty()}
            autoFocus={autoFocus}
          />
        ) : (
          <JobList
            workShift={workshift}
            jobList={jobList}
            operatingFlag={operatingFlag}
            startFlag={startFlag}
            refreshing={refreshing}
            logPress={(item, index) => this.logPress(item, index)}
            seleteItem={(item, index) => this.seleteItem(item, index)}
            startJob={() => this.startJob()}
            finishJob={() => this.finishJob()}
            refresh={() => this.refresh()}
          />
        )}

        {/* 确认删除弹出框 */}
        <Modal
          animationType="fade" // 弹出动画效果
          transparent={true} // 背景是否透明
          visible={deleteConfirm} // 决定modle是否显示
          onRequestClose={() => {
            // 手机物理返回  必填
            this.setState({deleteConfirm: !deleteConfirm});
          }}>
          <View style={[styles.modalBg, Styles.columnCenter]}>
            <View style={styles.middleModal}>
              <View style={styles.midalMain}>
                <Text style={styles.midalConfirmTitle}>确认</Text>
                <Text style={styles.midalConfirmContent}>
                  是否需要删除该数据
                </Text>
              </View>
              <View style={styles.midalBtnList}>
                <TouchableOpacity
                  onPress={() =>
                    this.setState({
                      deleteConfirm: !deleteConfirm,
                      indexItem: null,
                    })
                  }>
                  <Text style={styles.midalBtnView}>否</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.deleteConfimBtn()}>
                  <Text style={styles.midalBtnView}>是</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  /**刷新事件 */
  refresh = () => {
    this.submitSearchValue();
  };

  /**扫描小批号二维码提交方法 */
  submitSearchValue = () => {
    const {getStageDmcList, workItem} = this.props;
    const {searchValue} = this.state;
    if (!searchValue) {
      return ToastAndroid.showWithGravity(
        '请输入小批号!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    this.setState(
      {
        jobList: [],
        queueingList: [],
        processingList: [],
        operatingFlag: false,
        startFlag: false,
        enterFlag: false,
        addFlag: false,
        refreshing: true,
      },
      () => {
        getStageDmcList({workcenter_id: workItem.id, dmc: searchValue}).then(
          res => {
            this.setState({
              jobList: res.data,
              enterFlag: true,
              refreshing: false,
            });
            let queueingList = [],
              processingList = [],
              processingCompleteList = [];
            if (res.data.length) {
              /**等待入站条目 */
              queueingList = res.data.filter(item => {
                return item.status === 'queueing';
              });
              /**加工中的条目 */
              processingList = res.data.filter(item => {
                return item.status === 'processing';
              });
              /**加工完成数据*/
              processingCompleteList = res.data.filter(item => {
                return item.status === 'processing_complete';
              });
            }
            if (processingList.length) {
              this.setState({
                operatingFlag: true,
                startFlag: false,
                queueingList: queueingList,
                processingList: processingList,
              });
            } else if (queueingList.length) {
              this.setState({
                operatingFlag: true,
                startFlag: true,
                queueingList: queueingList,
                processingList: processingList,
              });
            } else {
              this.setState({
                operatingFlag: false,
                startFlag: false,
                queueingList: queueingList,
                processingList: processingList,
              });
            }
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
  /**添加事件 */
  addBtn = () => {
    const {searchValue, firstProcess, processingList, enterFlag} = this.state;
    const {workItem} = this.props;
    if (!searchValue || !enterFlag) {
      return ToastAndroid.showWithGravity(
        '请先确认小批号!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    if (!firstProcess.includes(workItem.id)) {
      return ToastAndroid.showWithGravity(
        '不是首站工序,不能新建任务!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    if (processingList.length) {
      return ToastAndroid.showWithGravity(
        '此挂架未完工,不能新增物料!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    /**进行新增物料 */
    this.setState({
      addFlag: true,
      titleName: '新建',
      item: {},
      indexItem: null,
      autoFocus: true,
    });
  };

  /**扫描或搜索二维码提交方法 */
  submitBarcodeValue = () => {
    const {barCode, searchValue} = this.state;
    const {workItem} = this.props;
    console.log(workItem.id, '工作重心');
    if (!barCode.trim()) {
      return ToastAndroid.showWithGravity(
        '请输入或扫描二维码!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    const {getCheckBarcode} = this.props;
    this.setState(
      {
        barCode: barCode,
      },
      () => {
        // workcenter_id:41
        getCheckBarcode({barcode: barCode, workcenter_id: workItem.id}).then(
          res => {
            console.log('二维码', res.data);
            if (res.data.result === '0') {
              return ToastAndroid.showWithGravity(
                res.data.error_info.reason,
                ToastAndroid.SHORT,
                ToastAndroid.TOP,
              );
            }
            // amanda add start
            if (res.data.result === '1') {
              if (res.data.quickly_finish === 1) {
                if (res.data.time_error === 1) {
                  return ToastAndroid.showWithGravity(
                    '未设置生产节拍，请确认',
                    ToastAndroid.SHORT,
                    ToastAndroid.TOP,
                  );
                }
              }
            }

            let item = res.data;
            if (item.quickly_finish === 1) {
              item.end_time = item.now_time;
              item['start_time'] = item.start_time;
            } else {
              item['start_time'] = item.now_time;
            }
            item.return_quickly_finish = item.quickly_finish;
            item['stage2_dmc'] = searchValue;
            item['ishighlight'] = false;
            item['islotend'] = false;
            item['remark'] = '';
            item['good_qty'] =
              item.good_qty - 0 ? item.good_qty : item.input_qty;
            item.diff_qty =
              item.input_qty - item.good_qty - item.scrap_qty + '';

            this.setState({
              item: item,
              rackCount: res.data['rack_count'],
            });
          },
          err => {
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
  /**编辑item的input框 */
  onChangeInputText = (value, key) => {
    if (key === 'barCode') {
      this.setState({
        barCode: value,
      });
    } else {
      const {item} = this.state;
      item[key] = value;
      if (key === 'quickly_finish') {
        if (value) {
          item.quickly_finish = 1;
          item.end_time = item.now_time;
        } else {
          item.quickly_finish = 0;
          item.end_time = null;
        }
      }
      if (key === 'input_qty') {
        item.good_qty = value;
      }

      this.setState(
        {
          item: item,
        },
        () => {
          if (
            key === 'input_qty' ||
            key === 'good_qty' ||
            key === 'scrap_qty' ||
            key === 'rack_qty'
          ) {
            item.diff_qty =
              item.input_qty - item.good_qty - item.scrap_qty + '';
          }
          this.setState({item, item});
        },
      );
    }
  };
  /**小批次搜索框 */
  onChangeText = e => {
    if (!e.trim()) {
      this.setState({
        enterFlag: false,
        searchValue: '',
      });
    } else {
      this.setState({
        searchValue: e.trim(),
      });
    }
  };
  /**长按item */
  logPress = (item, index) => {
    if (item.status) {
      return ToastAndroid.showWithGravity(
        '此条目不能删除',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    this.setState({
      deleteConfirm: true,
      indexItem: index,
    });
  };

  /**删除确认按钮 */
  deleteConfimBtn = () => {
    const {jobList, indexItem} = this.state;
    jobList.splice(indexItem, 1);
    this.setState({
      jobList: jobList,
      indexItem: null,
      deleteConfirm: false,
    });
  };
  /**选中item */
  seleteItem = (item, index) => {
    if (item.status === 'processing') {
      item['end_time'] = item.now_time;
      item['good_qty'] =
        item['good_qty'] - 0 ? item['good_qty'] : item['input_qty'];
    }
    if (item.status === 'queueing') {
      item['start_time'] = item.now_time;
    }
    this.setState({
      titleName: '编辑',
      addFlag: true,
      item: item,
      indexItem: index,
    });
  };
  /**开工按钮 */
  async startJob() {
    const {
      getSingleFirstProcessStartProcess,
      getSingleStartProcess,
      workItem,
      userInfo,
      getSingleFinishProcess,
      getEndTime,
    } = this.props;
    const {jobList, firstProcess, searchValue} = this.state;
    /**过滤出status为null 或queueing的数据*/
    const arrList = jobList.filter(item => {
      return !item.status || item.status === 'queueing';
    });
    let flag = true;
    for (let index = 0; index < arrList.length; index++) {
      const item = arrList[index];
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
      /**根据判断是否是第一工序 调用不同的方法 */
      if (firstProcess.includes(workItem.id)) {
        for (let index = 0; index < arrList.length; index++) {
          const item = arrList[index];
          const data = {
            workcenter_id: workItem.id,
            start_time: item.start_time,
            wip_parts_info: {
              [searchValue]: item.order_no,
            },
            ishighlight: item.ishighlight,
            rack_qty: item.rack_qty,
            islotend: item.islotend,
            input_qty: item.input_qty,
            process_id: item.process_id,
            partnumber: item.partnumber,
            product_line: item.product_line,
            stage1_dmc: item.stage1_dmc,
            submit_start: userInfo.username,
          };
          let resume_id = null,
            flag = true;
          await getSingleFirstProcessStartProcess(data).then(
            res => {
              if (res.data[0].result === 1) {
                resume_id = res.data[0].resume_id;
              } else {
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
          if (item['quickly_finish'] && resume_id) {
            let end_time = null;
            await getEndTime({prod_process_id: item.process_id}).then(res => {
              end_time = res.data;
            });
            const wip_parts_info = [];
            wip_parts_info.push({
              resume_id: resume_id,
              good_qty: item.input_qty,
              diff_qty: 0,
              scrap_qty: 0,
              output_qty: item.input_qty,
              modify_site: 'handheld',
            });
            const finish_data = {
              workcenter_id: workItem.id,
              start_time: item.start_time,
              end_time: end_time, //完工时间
              submit_end: userInfo.username,
              wip_parts_info: wip_parts_info,
            };
            await getSingleFinishProcess(finish_data).then(
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
          if (index === arrList.length - 1 && flag) {
            this.submitSearchValue();
            ToastAndroid.showWithGravity(
              '开工成功!',
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          }
        }
      } else {
        for (let index = 0; index < arrList.length; index++) {
          const item = arrList[index];
          const data = {
            workcenter_id: workItem.id,
            start_time: item.start_time,
            resume_id: [item.id],
            ishighlight: item.ishighlight,
            rack_qty: item.rack_qty,
            islotend: item.islotend,
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
            const finish_data = {
              workcenter_id: workItem.id,
              start_time: item.start_time,
              end_time: end_time, //完工时间
              submit_end: userInfo.username,
              wip_parts_info: wip_parts_info,
            };
            await getSingleFinishProcess(finish_data).then(
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
          if (index === arrList.length - 1 && flag) {
            this.submitSearchValue();
            ToastAndroid.showWithGravity(
              '开工成功!',
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          }
        }
      }
    }
  }
  /**报工按钮 */
  async finishJob() {
    /**过滤出需要报工的数据 */
    const {jobList, firstProcess} = this.state;
    const {getSingleFinishProcess, workItem, userInfo} = this.props;
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
      /**开始报工 */
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
            if (index === filterList.length - 1 && showFlag) {
              this.submitSearchValue();
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

  /**编辑(新建)数据时的保存按钮 */
  saveBtn = () => {
    const {item, jobList, indexItem, firstProcess} = this.state;
    console.log('新建或编辑', item);
    const {workItem, userInfo, getEditSubmit} = this.props;
    if (JSON.stringify(item) === '{}') {
      return ToastAndroid.showWithGravity(
        '请填写数据',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    /**校验必填项*/
    if (!item['input_qty']) {
      return ToastAndroid.showWithGravity(
        '入站数量必填',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    if (!item['rack_qty']) {
      return ToastAndroid.showWithGravity(
        '挂篮数量必填',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    if (item['input_qty'] - 0 <= 0) {
      return ToastAndroid.showWithGravity(
        '入站数量需大于0,请重新填写!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    if (item['rack_qty'] - 0 <= 0) {
      return ToastAndroid.showWithGravity(
        '挂篮数量需大于0,请重新填写!',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
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
    if (item.status === 'processing' || item.status === 'processing_complete') {
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
    }
    if (indexItem === null) {
      const arrList = jobList.push(item);
      return this.setState({
        jobList: jobList,
        startFlag: true,
        addFlag: false,
        operatingFlag: true,
        indexItem: null,
        rackCount: 0,
        autoFocus: false,
      });
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
                addFlag: false,
                operatingFlag: true,
                indexItem: null,
                autoFocus: false,
              },
              () => {
                this.submitSearchValue();
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
        addFlag: false,
        operatingFlag: true,
        indexItem: null,
        autoFocus: false,
      });
    }
    /**如果状态是已经完成就调用接口 */
  };

  /**关闭编辑页面 */
  closeEdit = () => {
    this.setState({
      addFlag: false,
      item: {},
      indexItem: null,
      autoFocus: false,
    });
  };

  /**挂篮数量点了提交/确定按钮 */
  submitRackQty = () => {
    /**判断是否是第一道工序 */
    const {titleName, item, rackCount} = this.state;
    if (titleName === '新建') {
      if (item['rack_qty'] - 0 <= 0) {
        return ToastAndroid.showWithGravity(
          '挂篮数量需大于0!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      }
      /**入站数量 =  挂篮数量 * 接口返回值rack_count */
      item['input_qty'] = ((item['rack_qty'] - 0) * (rackCount - 0)).toString();
      item.good_qty = item.input_qty
      item.diff_qty = item.input_qty - item.good_qty - item.scrap_qty + '';
      this.setState({
        item: item,
      });
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  search: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: setWidth(40),
    marginTop: setHeight(20),
    marginBottom: setHeight(30),
  },
  searchInput: {
    flex: 1,
    height: setHeight(100),
    backgroundColor: '#fff',
    marginRight: setWidth(20),
    borderRadius: 5,
    paddingHorizontal: setWidth(30),
    fontSize: setText(36),
  },
  searchBtn: {
    width: setWidth(80),
    height: setHeight(80),
    backgroundColor: '#fff',
    height: setHeight(100),
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(52, 52, 52, 0.2)',
  },
  middleModal: {
    width: setWidth(600),
    backgroundColor: '#fff',
    height: setHeight(280),
    borderRadius: 5,
  },
  midalMain: {
    height: setHeight(180),
    paddingHorizontal: setWidth(40),
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingTop: setHeight(10),
  },
  midalConfirmTitle: {
    fontSize: setText(36),
    textAlign: 'center',
  },
  midalConfirmContent: {
    fontSize: setText(28),
    textAlign: 'center',
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

const mapStateToProps = state => ({
  userInfo: state.login.userInfo,
});

const mapDispatchToProps = dispatch => ({
  getStageDmcList: dispatch.jobinformation.getStageDmcList,
  getCheckBarcode: dispatch.jobinformation.getCheckBarcode,
  getStartProcess: dispatch.jobinformation.getStartProcess,
  getSingleFirstProcessStartProcess:
    dispatch.jobinformation.getSingleFirstProcessStartProcess,
  getSingleStartProcess: dispatch.jobinformation.getSingleStartProcess,
  getSingleFinishProcess: dispatch.jobinformation.getSingleFinishProcess,
  getEndTime: dispatch.jobinformation.getEndTime,
  getEditSubmit: dispatch.jobinformation.getEditSubmit,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Pylon);
