import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Container} from 'native-base';
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  ToastAndroid,
  Text,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import {Actions} from 'react-native-router-flux';
import LinearGradient from 'react-native-linear-gradient';
import handlerOnceTap from '~/utils/handlerOnceTap.util';
import Header from '../../components/Header';
import ChechModal from '../../components/checkModal';
import Http from '~/utils/http';

class Input extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
      inputListData: [], // 不良项列表
      logPerssFlag: true,
      marVisiable: false,
      poVisiable: false,
      marListData: [], // 物料列表
      marRefreshing: false,
      poRefreshing: false,
      marSelectedItem: {},
      poSelectedItem: {},
      poListData: [], // po列表
      totalBadNum: 0, // 不良数量总计
      checkQuantity: '', // 检验数量
      qc_start_time: '', // 进入录入页面的时间
      isVisible: false, // 是否展示提审弹框
      isShowCheck: true, // 是否展示审核数量
      isSelectflag: false, // 抽检成功后判断【物料号】【PO】是否可选
      materialCode: '', // 物料编码名称
      poCode: '', // po号名称
      input_qty_all: 0, // 入站数量
    };
  }

  componentDidMount() {
    this.getNowTime();
    const {jobItem} = this.props;
    // 来自抽检和修改的，物料号和批次号不允许点击
    if (jobItem) {
      // 来自job页面
      this.setState({
        poSelectedItem: jobItem,
        isSelectflag: true,
        materialCode: jobItem.partnumber,
        poCode: jobItem.stage1_dmc,
      });
      if (jobItem.prod_process_id) {
        // 来自
        this.initBadList();
      } else {
        // 来自修改
        this.setState({inputListData: [], totalBadNum: 0}, () => {
          this.setState({
            inputListData: jobItem.result_json_data,
            totalBadNum: this.getTotal(jobItem.result_json_data),
            isShowCheck: false,
          });
        });
      }
    } else {
      this.initBadList();
    }
  }

  getNowTime() {
    Http.get('/app/gerNowTime').then(res => {
      console.log('时间',res.data)
      this.setState({qc_start_time: res.data});
    });
  }

  render() {
    const {workItem, fullname} = this.props;
    const {
      refreshing,
      inputListData,
      marVisiable,
      poVisiable,
      marListData,
      poListData,
      totalBadNum,
      isShowCheck,
      checkQuantity,
      isVisible,
      isSelectflag,
      materialCode,
      poCode,
    } = this.state;
    return (
      <Container style={{flex: 1}}>
        <LinearGradient colors={['#00bdf7', '#00b3f2']}>
          <Header
            rightFlag={false}
            leftTitle={`${workItem.name}_录入`}
            rightBtnName={'提审'}
            leftClick={() => this.back()}
            rightSublim={() => this.submit('check')}
          />
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.labelText}>当前员工</Text>
              <Text style={styles.labelValue}>{fullname}</Text>
            </View>
            <View style={styles.headerCenter}>
              <View style={styles.marCode}>
                <Text style={[styles.labelText, styles.selectLable]}>
                  物料编码
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handlerOnceTap(() => this.selectMarList());
                  }}>
                  <View
                    style={[
                      styles.marValue,
                      isSelectflag
                        ? {backgroundColor: '#f0f0f0'}
                        : {backgroundColor: '#fff'},
                    ]}>
                    <Text style={styles.placeholder}>{materialCode}</Text>
                    <Icon name="down" color="#0080dc" size={setText(40)} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.marCode, styles.poNumber]}>
                <Text style={[styles.labelText, styles.selectLable]}>
                  批次号
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handlerOnceTap(() => this.selectPoList());
                  }}>
                  <View
                    style={[
                      styles.marValue,
                      isSelectflag
                        ? {backgroundColor: '#f0f0f0'}
                        : {backgroundColor: '#fff'},
                    ]}>
                    <Text style={styles.placeholder}>{poCode}</Text>
                    <Icon name="down" color="#0080dc" size={setText(40)} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.num}>{totalBadNum}</Text>
              <Text style={styles.numText}>异常总数</Text>
            </View>
          </View>
        </LinearGradient>
        <LinearGradient
          colors={['#00b1f1', '#0084de']}
          style={styles.inputMain}>
          <FlatList
            refreshing={refreshing}
            data={inputListData}
            horizontal={false}
            numColumns={5}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => this.renderItem(item, index)}
            onRefresh={() => this.initBadList()}
            ItemSeparatorComponent={() => (
              <View style={{height: setHeight(18)}} />
            )}
            ListEmptyComponent={() => this.renderEmpty()}
          />
        </LinearGradient>

        {/* 物料编码弹框 */}
        <Modal
          onRequestClose={() => {
            this.setState({marVisiable: !marVisiable});
          }}
          visible={marVisiable}
          transparent={true}
          animationType="slide">
          <TouchableWithoutFeedback
            onPress={() => {
              this.setState({marVisiable: false});
            }}>
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'}} />
          </TouchableWithoutFeedback>
          <View style={styles.MarModal}>
            <FlatList
              ListHeaderComponent={() => this.ListHeaderComponent()}
              refreshing={refreshing}
              keyExtractor={(item, index) => index.toString()}
              data={marListData}
              renderItem={({item, index}) => this.modelRenderItem(item, index)}
            />
          </View>
        </Modal>

        {/* PO的弹框 */}
        <Modal
          onRequestClose={() => {
            this.setState({poVisiable: !poVisiable});
          }}
          visible={poVisiable}
          transparent={true}
          animationType="slide">
          <TouchableWithoutFeedback
            onPress={() => {
              this.setState({poVisiable: false});
            }}>
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'}} />
          </TouchableWithoutFeedback>
          <View style={styles.MarModal}>
            <FlatList
              ListHeaderComponent={() => this.poListHeaderComponent()}
              refreshing={refreshing}
              keyExtractor={(item, index) => index.toString()}
              data={poListData}
              renderItem={({item, index}) =>
                this.poModelRenderItem(item, index)
              }
            />
          </View>
        </Modal>

        {/* 提审确认的弹框 */}
        <ChechModal
          isVisible={isVisible}
          inspectionList={inputListData.filter(key => key.count > 0)}
          isLeft={false}
          checkQuantity={checkQuantity}
          changeCheckQuantity={val => {
            this.changeCheckQuantity(val);
          }}
          isCheck={isShowCheck}
          total={totalBadNum}
          partnumber={materialCode}
          lotNo={poCode}
          username={fullname}
          confirmBtn={() => {
            this.confirmBtn();
          }}
          cancelBtn={() => {
            this.submit();
          }}
        />
      </Container>
    );
  }

  // 物料编码头部
  ListHeaderComponent() {
    const {marRefreshing} = this.state;
    return (
      <View style={styles.marshopListTop}>
        <Text style={styles.marshopListTopLeft}>物料编码</Text>
        <ActivityIndicator
          animating={marRefreshing}
          size={setText(40)}
          color="#0080dc"
        />
        <TouchableOpacity
          onPress={() => {
            this.affirm();
          }}>
          <Text style={styles.marshopListTopRight}>确定</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 物料编码选择
  modelRenderItem(item, index) {
    const {marSelectedItem} = this.state;
    return (
      <TouchableOpacity
        onPress={() => handlerOnceTap(() => this.setSelectedItem(item))}>
        <View
          style={index % 2 === 0 ? styles.marshopItem : styles.marshopItemBg}>
          <Text
            style={
              marSelectedItem.partnumber === item.partnumber
                ? styles.marshopSelectText
                : styles.marshopText
            }>
            {item.partnumber}
          </Text>
          {marSelectedItem.partnumber == item.partnumber ? (
            <Icon name="check" color="#0080dc" size={setText(36)} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  // 批次号头部
  poListHeaderComponent() {
    const {poRefreshing} = this.state;
    return (
      <View style={styles.marshopListTop}>
        <Text style={styles.marshopListTopLeft}>批次号</Text>
        <ActivityIndicator
          animating={poRefreshing}
          size={setText(40)}
          color="#0080dc"
        />
        <TouchableOpacity
          onPress={() => {
            this.affirmPo();
          }}>
          <Text style={styles.marshopListTopRight}>确定</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // po号选择
  poModelRenderItem(item, index) {
    const {poSelectedItem} = this.state;
    return (
      <TouchableOpacity
        onPress={() => handlerOnceTap(() => this.setPoSelectedItem(item))}>
        <View
          style={index % 2 === 0 ? styles.marshopItem : styles.marshopItemBg}>
          <Text
            style={
              poSelectedItem.stage1_dmc === item.stage1_dmc
                ? styles.marshopSelectText
                : styles.marshopText
            }>
            {item.stage1_dmc}
          </Text>
          {poSelectedItem.stage1_dmc == item.stage1_dmc ? (
            <Icon name="check" color="#0080dc" size={setText(36)} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  // 不良项有数据的渲染
  renderItem(item, index) {
    const {logPerssFlag} = this.state;
    return (
      <TouchableOpacity
        onLongPress={() => this.logPress()}
        onPress={() => this.addItemCount(item)}>
        <View style={styles.badCard}>
          <View
            style={[
              styles.commonStyle,
              index < 10 ? styles.cardTopValue : styles.cardBottomValue,
            ]}>
            <Text style={styles.cardValue}>{item.value}</Text>
          </View>
          <View style={styles.badCardCount}>
            {logPerssFlag ? (
              <Text style={styles.cardCount}>{item.count}</Text>
            ) : (
              <View style={styles.badCardNum}>
                <TouchableOpacity
                  onPress={() => handlerOnceTap(() => this.reduceCount(item))}>
                  <View style={styles.iconView}>
                    <Icon name="minus" color="#0080dc" size={setText(48)} />
                  </View>
                </TouchableOpacity>
                <TextInput
                  style={styles.inputCount}
                  multiline={true}
                  keyboardType="numeric"
                  clearTextOnFocus={true}
                  defaultValue={item.count.toString()}
                  onChangeText={text => this.onChangeText(text, item)}
                />
                <TouchableOpacity
                  onPress={() => handlerOnceTap(() => this.checkCount(item))}>
                  <View style={styles.iconView}>
                    <Icon name="check" color="#0080dc" size={setText(48)} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // 无数据的渲染
  renderEmpty() {
    return (
      <View style={styles.empty}>
        <Image
          source={require('../../assets/images/empty.png')}
          style={styles.noData}
        />
      </View>
    );
  }

  // 初始化不良项数据
  initBadList = () => {
    const {workItem, getBadList} = this.props;
    this.setState({inputListData: [], refreshing: true}, () => {
      getBadList({code: workItem.code})
        .then(res => {
          const resData = res.data;
          if (resData) {
            this.setState({
              inputListData: resData,
              refreshing: false,
              totalBadNum: this.getTotal(resData),
            });
          }
        })
        .catch(err => {
          this.setState({refreshing: false});
          ToastAndroid.showWithGravity(
            err.data,
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        });
    });
  };

  // 初始化物料编码和批次号
  initMarList = () => {
    const {workItem, getMarList} = this.props;
    this.setState(
      {
        marListData: [],
        marRefreshing: true,
        poListData: [],
        marSelectedItem: {},
        poSelectedItem: {},
        materialCode: '',
        poCode: '',
      },
      () => {
        getMarList({workcenter_id: workItem.id})
          .then(res => {
            const resData = res.data;
            if (resData.length) {
              this.setState({
                marListData: resData,
                marRefreshing: false,
                poListData: resData[0].detail,
              });
            } else {
              this.setState({marRefreshing: false});
            }
          })
          .catch(err => {
            this.setState({marRefreshing: false});
            ToastAndroid.showWithGravity(
              err.data,
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          });
      },
    );
  };

  // 点击出现物料弹框
  selectMarList = () => {
    const {isSelectflag} = this.state;
    if (isSelectflag) {
      return;
    }
    this.setState({marVisiable: true});
    this.initMarList();
  };

  // 选择物料编码
  setSelectedItem = item => {
    this.setState({marSelectedItem: item, poCode: ''});
  };

  // 确认物料编码
  affirm = () => {
    const {marSelectedItem, marListData} = this.state;
    if (!marListData.length) {
      this.setState({marVisiable: false});
      return;
    }
    let arrData = [];
    arrData =
      marListData.filter(
        key => marSelectedItem.partnumber === key.partnumber,
      )[0].detail || [];
    this.setState({
      poListData: arrData,
      marVisiable: false,
      materialCode: marSelectedItem.partnumber,
    });
  };

  // 点击出现Po弹框
  selectPoList = () => {
    const {isSelectflag} = this.state;
    if (isSelectflag) {
      return;
    }
    this.setState({poVisiable: true});
  };

  // 确认PO号
  affirmPo = () => {
    const {poSelectedItem} = this.state;
    this.setState({poVisiable: false, poCode: poSelectedItem.stage1_dmc});
  };

  // 选择PO
  setPoSelectedItem = item => {
    this.setState({poSelectedItem: item});
  };

  // 点击不良卡片 +1
  addItemCount = item => {
    // 如果物料编码和批次号为空，不能编辑不良项
    const {materialCode, poCode} = this.state;
    if (materialCode === '') {
      ToastAndroid.showWithGravity(
        '物料编码不能为空',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    if (poCode === '') {
      ToastAndroid.showWithGravity(
        '批次号不能为空',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    let {inputListData} = this.state;
    inputListData = inputListData.reduce((val, k) => {
      if (item.key === k.key) {
        ++k.count;
      }
      return [...val, k];
    }, []);
    this.setState({
      inputListData: inputListData,
      totalBadNum: this.getTotal(inputListData),
    });
  };

  // 点击减1
  reduceCount = item => {
    let {inputListData} = this.state;
    if (!item.count) {
      return ToastAndroid.showWithGravity(
        '不良项数量必须为>=0的整数',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    inputListData = inputListData.reduce((val, k) => {
      if (item.key === k.key) {
        --k.count;
      }
      return [...val, k];
    }, []);
    this.setState({
      inputListData: inputListData,
      totalBadNum: this.getTotal(inputListData),
    });
  };

  // 确定
  checkCount = item => {
    // 点击√回到正常模式
    this.setState({logPerssFlag: !this.state.logPerssFlag});
  };

  // 改变输入值  只允许正整数和0
  onChangeText(text, item) {
    let {inputListData} = this.state;
    let regText = text.replace(/[^\d]+/, '');
    inputListData = inputListData.reduce((val, k) => {
      if (item.key === k.key) {
        k.count = +regText;
      }
      return [...val, k];
    }, []);
    this.setState({
      inputListData: inputListData,
      totalBadNum: this.getTotal(inputListData),
    });
  }

  // 统计不良数据
  getTotal = arr => {
    let total = arr.map(k => k.count).reduce((a, b) => a + b);
    return total * 1;
  };

  // 长按变为编辑状态
  logPress = () => {
    // 如果物料编码和批次号为空，不能编辑不良项
    const {materialCode, poCode} = this.state;
    if (materialCode === '') {
      ToastAndroid.showWithGravity(
        '物料编码不能为空',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    if (poCode === '') {
      ToastAndroid.showWithGravity(
        '批次号不能为空',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    this.setState({logPerssFlag: !this.state.logPerssFlag});
  };

  // 返回
  back = () => {
    const {jobItem} = this.props;
    if (!jobItem) {
      DeviceEventEmitter.emit('workcenter');
      Actions.popTo('workcenter');
    } else {
      DeviceEventEmitter.emit('jobinformation');
      Actions.popTo('jobinformation');
    }
  };

  // 检验数量  只允许正整数
  changeCheckQuantity = val => {
    let regVal = val.replace(/^(0+)|[^\d]+/g, '');
    this.setState({checkQuantity: regVal});
  };

  // 点击提审按钮
  submit = val => {
    const {isVisible, materialCode, poCode} = this.state;
    if (val === 'check' && materialCode === '') {
      ToastAndroid.showWithGravity(
        '物料编码不能为空',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    if (val === 'check' && poCode === '') {
      ToastAndroid.showWithGravity(
        '批次号不能为空',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    this.setState({
      isVisible: !isVisible,
      checkQuantity: '',
    });
    this.getInputQtyAll();
  };

  // 提交按钮
  confirmBtn = () => {
    const {checkQuantity, input_qty_all} = this.state;
    const {submitData, jobItem} = this.props;
    if (checkQuantity > input_qty_all) {
      return ToastAndroid.showWithGravity(
        `检验数量必须小于当前入站数量${input_qty_all}`,
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    let params = {};
    if (jobItem) {
      // 判断是否来自工作中心
      if (jobItem.prod_process_id) {
        // 抽检传参
        if (!checkQuantity) {
          ToastAndroid.showWithGravity(
            '检验数量为空,请确认!',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
          return;
        }
        params = this.getNewParams();
      } else {
        params = this.getChangeParams(); // 修改传参
      }
    } else {
      if (!checkQuantity) {
        ToastAndroid.showWithGravity(
          '检验数量为空,请确认!',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
        return;
      }
      params = this.getNewParams();
      delete params.iqs_data.attr_data.spot_test_flag;
      delete params.iqs_data.action_data.confirme_user;
    }
    submitData(params)
      .then(res => {
        const resData = res.data;
        if (resData) {
          if (jobItem) {
            // 如果是修改，返回上一页
            Actions.popTo('jobinformation');
            DeviceEventEmitter.emit('jobinformation');
          } else {
            this.initBadList(), this.initMarList();
          }
          this.setState({
            isVisible: false,
            logPerssFlag: true,
            isSelectflag: false,
          });
          ToastAndroid.showWithGravity(
            '提交成功',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
          );
        }
      })
      .catch(err => {
        this.setState({marRefreshing: false});
        ToastAndroid.showWithGravity(
          err.data,
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        );
      });
  };

  // 新建传参
  getNewParams = () => {
    const {workItem, fullname, jobItem} = this.props;
    const {
      materialCode,
      poCode,
      totalBadNum,
      checkQuantity,
      qc_start_time,
      inputListData,
      poSelectedItem,
    } = this.state;
    const params = {
      partnumber: materialCode,
      lot_no: poCode,
      iqs_data: {
        partnumber: materialCode,
        process_code: workItem.code,
        lot_no: poCode,
        prod_json_data: {
          scrap_qty: totalBadNum,
          est_inspect_qty: +checkQuantity,
        },
        qc_start_time: qc_start_time,
        qc_workshift: fullname,
        qc_json_data: {
          scrap_qty: totalBadNum,
          workcenter_id: workItem.id,
        },
        result_json_data: inputListData,
        status: jobItem ? 'confirmed' : 'inspecting',
        attr_data: {
          prod_order_id: poSelectedItem.prod_order_id,
          prod_process_id: poSelectedItem.prod_process_id,
          spot_test_flag: 1,
        },
        action_data: {
          author: fullname,
          confirme_user: fullname,
        },
      },
    };
    return params;
  };

  // 修改传参
  getChangeParams = () => {
    const {fullname, jobItem} = this.props;
    const {
      totalBadNum,
      checkQuantity,
      inputListData,
      materialCode,
      poCode,
    } = this.state;
    const params = {
      id: jobItem.id,
      partnumber: materialCode,
      lot_no: poCode,
      iqs_data: {
        prod_json_data: {
          scrap_qty: totalBadNum,
          est_inspect_qty: +checkQuantity,
        },
        qc_json_data: {
          scrap_qty: totalBadNum,
          confirm: fullname,
        },
        result_json_data: inputListData,
        status: 'confirmed',
        action_data: {
          confirme_user: fullname,
        },
      },
    };
    return params;
  };

  // 获取当前入站数量
  getInputQtyAll = () => {
    const {workItem, jobItem, getProcessData} = this.props;
    const {poCode, input_qty_all} = this.state;
    let jobData = [];
    getProcessData({
      workcenter_id: workItem.id,
      stage1_dmc: poCode,
      status: 'processing',
      isReceive: workItem.isReceive,
    }).then(res => {
      jobData = res.data;
      const inputValue = jobData.reduce((total, item) => {
        return total + (item['attr_data']['input_qty'] - 0);
      }, 0);
      this.setState({input_qty_all: inputValue});
    });
  };
}

const styles = StyleSheet.create({
  inputTop: {},
  headerTop: {
    height: setHeight(184),
    flexDirection: 'row',
    paddingHorizontal: setWidth(40),
  },
  headerLeft: {
    width: setWidth(442),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: setWidth(10),
  },
  labelText: {
    color: '#999999',
    fontSize: setText(28),
  },
  labelValue: {
    color: '#333333',
    fontSize: setText(42),
    marginLeft: setWidth(16),
  },
  headerCenter: {
    width: setWidth(1050),
    marginHorizontal: setWidth(24),
  },
  marCode: {
    flexDirection: 'row',
    height: setHeight(80),
    backgroundColor: '#ffffff',
    borderRadius: setWidth(5),
  },
  selectLable: {
    width: setWidth(168),
    lineHeight: setHeight(80),
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d9d9d9',
  },
  marValue: {
    display: 'flex',
    flex: 1,
    width: setWidth(876),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: setText(16),
  },
  placeholder: {
    color: '#333333',
    fontSize: setText(36),
  },
  poNumber: {
    marginTop: setHeight(24),
  },
  headerRight: {
    width: setWidth(280),
    backgroundColor: '#ff4a60',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: setWidth(10),
  },
  num: {
    fontSize: setText(72),
    color: '#ffffff',
  },
  numText: {
    fontSize: setText(28),
    color: '#FFFFFF',
  },
  inputMain: {
    flex: 1,
    padding: setWidth(40),
  },
  badCard: {
    width: setWidth(345),
    height: setHeight(172),
    backgroundColor: '#ffffff',
    borderRadius: setWidth(10),
    marginRight: setHeight(24),
    alignItems: 'center',
  },
  cardTopValue: {
    backgroundColor: '#72809b',
  },
  cardBottomValue: {
    backgroundColor: '#42c66a',
  },
  commonStyle: {
    width: '100%',
    height: setHeight(85),
    borderTopLeftRadius: setWidth(10),
    borderTopRightRadius: setWidth(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: setText(40),
    color: '#FFFFFF',
  },
  badCardCount: {
    width: setWidth(332),
    height: setHeight(74),
    marginTop: setHeight(4),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f8f9',
  },
  cardCount: {
    fontSize: setText(36),
    color: '#ff4a60',
  },
  badCardNum: {
    width: setWidth(332),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: '#d9d9d9',
    borderWidth: setWidth(1),
  },
  iconView: {
    width: setWidth(100),
    height: setHeight(58),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  inputCount: {
    width: setWidth(124),
    height: setHeight(58),
    textAlign: 'center',
    color: '#ff4a60',
    fontSize: setText(36),
    backgroundColor: '#f0f0f0',
    borderLeftColor: '#d9d9d9',
    borderLeftWidth: setHeight(1),
    borderRightWidth: setHeight(1),
    borderRightColor: '#d9d9d9',
  },
  MarModal: {
    height: setHeight(771),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#ffffff',
  },
  marshopListTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: setHeight(98),
    alignItems: 'center',
    paddingLeft: setWidth(30),
    paddingRight: setWidth(30),
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  marshopListTopLeft: {
    fontSize: setText(42),
    color: '#333333',
  },
  marshopListTopRight: {
    fontSize: setText(42),
    color: '#0080dc',
  },
  marshopItem: {
    height: setHeight(84),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: setWidth(20),
    paddingRight: setWidth(20),
  },
  marshopItemBg: {
    height: setHeight(86),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: setWidth(20),
    paddingRight: setWidth(20),
    backgroundColor: '#f2f2f2',
  },
  marshopText: {
    fontSize: setText(36),
    color: '#333333',
  },
  marshopSelectText: {
    fontSize: setText(36),
    color: '#0080dc',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
  },
  noData: {
    width: setWidth(288),
    height: setHeight(335),
    marginTop: setHeight(200),
  },
});

const mapStateToProps = state => ({
  fullname: state.login.userInfo.fullname,
});

const mapDispatchToProps = dispatch => ({
  getBadList: dispatch.input.getBadList,
  getMarList: dispatch.input.getMarList,
  submitData: dispatch.input.submitData,
  getProcessData: dispatch.jobinformation.getProcessData,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Input);
