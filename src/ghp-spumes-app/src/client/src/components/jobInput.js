import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Modal,
} from 'react-native';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import Icon from 'react-native-vector-icons/AntDesign';
import DatePicker from 'react-native-date-picker';
import Styles from '~/assets/styles/base';
import PropTypes from 'prop-types';

class JobInput extends Component {
  static propTypes = {
    item: PropTypes.object, //编辑或新建的数据
    // dateFlag: PropTypes.bool, // 日期标志
    workItem: PropTypes.object, //工作中心数据
    titleName: PropTypes.string, //标题
    barCode: PropTypes.string, //扫描的二维码
    stageFlag: PropTypes.bool, //挂架报工标志
  };
  static defaultProps = {
    item: {
      partnumber: '', //物料
      stage1_dmc: '', //批号
      stage2_dmc: '', //小批号
      start_time: '',
      end_time: '',
      input_qty: '0', //入站数量
      product_line: '', //产线
      good_qty: '0', //报工数量
      scrap_qty: '0', //不合格数量
      rack_qty: '0', //挂篮数量
      diff_qty: '0', // 盈亏数量
      quickly_finish: 0, //开工即完工
      ishighlight: false, //是否高亮
      remark: '', //备注
      islotend: false, //结束本批次
      autoFocus: false, //自动聚焦
    },
    // dateFlag: false,
    workItem: {},
    titleName: '新建',
    barCode: '', //扫描的二维码
    stageFlag: false,
  };
  constructor(props) {
    super(props);
    this.state = {
      imgList: {
        date: require('~/assets/images/date.png'),
      },
      dateName: '',
      firstProcess: [5, 8, 30, 41, 46, 50],
      firstProcessFlag: false,
    };
  }
  componentDidMount() {
    const {firstProcess} = this.state;
    const {workItem} = this.props;
    const flag = firstProcess.includes(workItem.id);
    this.setState({
      firstProcessFlag: flag,
    });
  }

  render() {
    const {imgList, barCode, firstProcessFlag} = this.state;
    const {
      titleName,
      item,
      onChangeText,
      saveBtn,
      closeEdit,
      submitBarcodeValue,
      stageFlag,
      submitRackQty,
      autoFocus,
    } = this.props;
    console.log('渲染', item);

    return (
      <View style={{flex: 1}}>
        <ScrollView>
          <View style={styles.main}>
            <View style={styles.mainHeader}>
              <Text style={styles.mainHeaderTitle}>{titleName}</Text>
              <TouchableOpacity onPress={() => closeEdit()}>
                <View style={styles.mainHeaderClose}>
                  <Icon size={setText(36)} name="close" color={'#aaa'} />
                </View>
              </TouchableOpacity>
            </View>
            {titleName === '新建' ? (
              <View style={styles.mainItem}>
                <Text style={styles.mainInputTitle}>扫描或搜索</Text>
                <TextInput
                  style={styles.mainInputValue}
                  onChangeText={value => onChangeText(value, 'barCode')}
                  value={barCode}
                  onSubmitEditing={(value, barCode) =>
                    submitBarcodeValue(value, barCode)
                  }
                  autoFocus={autoFocus}
                />
              </View>
            ) : null}
            <View style={styles.mainItem}>
              <Text style={styles.mainInputTitle}>物料</Text>
              <TextInput
                style={styles.mainInputValue}
                value={item.partnumber}
                onChangeText={value => onChangeText(value, 'partnumber')}
                editable={false}
              />
            </View>
            {/* 报工列表显示小批号 */}
            {/* 挂架报工不显示小批号 */}
            {stageFlag ? (
              <View style={styles.mainItem}>
                <Text style={styles.mainInputTitle}>批号</Text>
                <TextInput
                  style={styles.mainInputValue}
                  value={item.stage1_dmc}
                  onChangeText={value => onChangeText(value, 'stage1_dmc')}
                  editable={false}
                />
              </View>
            ) : (
              <View style={styles.mainSpecial}>
                <View style={styles.mainSpecialItem}>
                  <Text style={styles.mainInputTitle}>批号</Text>
                  <TextInput
                    style={styles.mainInputValue}
                    value={item.stage1_dmc}
                    onChangeText={value => onChangeText(value, 'stage1_dmc')}
                    editable={false}
                  />
                </View>
                <View style={styles.mainSpecialItem}>
                  <Text style={styles.mainInputTitle}>小批号</Text>
                  <TextInput
                    style={styles.mainInputValue}
                    value={item.stage2_dmc}
                    onChangeText={value => onChangeText(value, 'stage2_dmc')}
                    editable={false}
                  />
                </View>
              </View>
            )}
            {/* <View style={styles.mainItem}>
              <Text style={styles.mainInputTitle}>开始时间</Text>
              <TouchableOpacity
                onPress={() => showModel('start_time')}
                style={{ position: 'relative' }}>
                <TextInput
                  style={styles.mainInputValue}
                  value={item.start_time} editable={false}></TextInput>
                <Image source={imgList.date} style={styles.dateImage} />
              </TouchableOpacity>
            </View>
            <View style={styles.mainItem}>
              <Text style={styles.mainInputTitle}>结束时间</Text>
              <TouchableOpacity
                onPress={() => showModel('end_time')}
                style={{ position: 'relative' }}>
                <TextInput
                  style={styles.mainInputValue}
                  value={item.end_time} editable={false}>
                </TextInput>
                <Image source={imgList.date} style={styles.dateImage} />
              </TouchableOpacity>
            </View> */}
            <View style={[styles.mainItem, {position: 'relative'}]}>
              <Text style={styles.mainInputTitle}>开始时间</Text>
              <TextInput
                style={[
                  styles.mainInputValue,
                  {color: item.red_tag === 1 ? 'red' : '#000'},
                ]}
                value={item.start_time}
                onChangeText={value => onChangeText(value, 'start_time')}
              />
              <Image
                source={imgList.date}
                style={styles.dateImage}
              />
            </View>
            <View style={[styles.mainItem, {position: 'relative'}]}>
              <Text style={styles.mainInputTitle}>结束时间</Text>
              <TextInput
                style={styles.mainInputValue}
                value={item.end_time}
                onChangeText={value => onChangeText(value, 'end_time')}
                editable={
                  item.status === 'queueing' || !item.status ? false : true
                }
              />
              <Image source={imgList.date} style={styles.dateImage} />
            </View>
            <View style={styles.mainSpecial}>
              <View style={styles.mainSpecialItem}>
                <Text style={styles.mainInputTitle}>入站数量</Text>
                <TextInput
                  style={styles.mainInputValue}
                  value={item.input_qty}
                  keyboardType="numeric"
                  onChangeText={value => onChangeText(value, 'input_qty')}
                  editable={!item.status ? true : false || firstProcessFlag}
                />
              </View>
              <View style={styles.mainSpecialItem}>
                <Text style={styles.mainInputTitle}>产线</Text>
                <TextInput
                  style={styles.mainInputValue}
                  value={item.product_line}
                  onChangeText={value => onChangeText(value, 'product_line')}
                  editable={!item.status ? true : false}
                />
              </View>
            </View>
            <View style={styles.mainSpecial}>
              <View style={styles.mainSpecialItem}>
                <Text style={styles.mainInputTitle}>报工数量</Text>
                <TextInput
                  style={styles.mainInputValue}
                  keyboardType="numeric"
                  value={item.good_qty}
                  onChangeText={value => onChangeText(value, 'good_qty')}
                />
              </View>
              <View style={styles.mainSpecialItem}>
                <Text style={styles.mainInputTitle}>不合格数量</Text>
                <TextInput
                  style={styles.mainInputValue}
                  value={item.scrap_qty}
                  keyboardType="numeric"
                  onChangeText={value => onChangeText(value, 'scrap_qty')}
                />
              </View>
            </View>
            <View style={styles.mainSpecial}>
              <View style={styles.mainSpecialItem}>
                <Text style={styles.mainInputTitle}>挂篮数量</Text>
                <TextInput
                  style={styles.mainInputValue}
                  keyboardType="numeric"
                  value={item.rack_qty}
                  onChangeText={value => onChangeText(value, 'rack_qty')}
                  onSubmitEditing={() => submitRackQty()}
                />
              </View>
              <View style={styles.mainSpecialItem}>
                <Text style={styles.mainInputTitle}>盈亏数量</Text>
                <TextInput
                  style={styles.mainInputValue}
                  keyboardType="numeric"
                  value={item.diff_qty}
                  onChangeText={value => onChangeText(value, 'diff_qty')}
                />
              </View>
            </View>
            <View style={styles.mainSwitch}>
              <Text style={styles.mainSwitchTitle}>开工即完工</Text>
              <Switch
                style={styles.switch}
                trackColor={{true: '#00bdf7'}}
                thumbColor="#ffffff"
                value={item.quickly_finish === 1 ? true : false}
                onValueChange={value => onChangeText(value, 'quickly_finish')}
                disabled={item.return_quickly_finish === 1 ? false : true}
              />
            </View>
            <View style={styles.mainSwitch}>
              <Text style={styles.mainSwitchTitle}>高亮</Text>
              <Switch
                style={styles.switch}
                trackColor={{true: '#00bdf7'}}
                thumbColor="#ffffff"
                value={item.ishighlight}
                onValueChange={value => onChangeText(value, 'ishighlight')}
              />
            </View>
            <TextInput
              style={styles.mainTextarea}
              placeholder={'备注'}
              multiline={true}
              textAlignVertical={'top'}
            />
            {item.islotend ? (
              <TouchableOpacity onPress={() => onChangeText(false, 'islotend')}>
                <View style={[styles.btnView, styles.btnSpecialView]}>
                  <Text style={[styles.btnTitle, styles.btnSpecialTitle]}>
                    结束本批次
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => onChangeText(true, 'islotend')}>
                <View style={styles.btnView}>
                  <Text style={styles.btnTitle}>结束本批次</Text>
                </View>
              </TouchableOpacity>
            )}
            {/* <View style={styles.btnView}>
                <Text style={[styles.btnTitle, styles.btnSpecialTitle1]}>自动计算</Text>
              </View> */}
            <TouchableOpacity onPress={() => saveBtn()}>
              <View style={styles.finishBtn}>
                <Icon name="check" color={'#fff'} size={setText(60)} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* <Modal
          animationType="fade"// 弹出动画效果
          transparent={true}// 背景是否透明
          visible={dateFlag}// 决定modle是否显示
          onRequestClose={() => { // 手机物理返回  必填
            this.setState({ dateFlag: !dateFlag })
          }}
        >
          <View style={[styles.modalBg, Styles.columnCenter]}>
            <View style={styles.middleModal}>
              <View style={styles.iconHeader}>
                <TouchableOpacity onPress={() => { confirmModal() }}>
                  <Icon name='check' style={styles.checkCircle} ></Icon>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { closeModal() }}>
                  <Icon name='close' style={styles.closeCircle} ></Icon>
                </TouchableOpacity>
              </View>
              <DatePicker
                mode={'datetime'}
                date={'2020-09-09 07:07:30'}
                format={'YYYY-MM-DD HH:mm:ss'}
                onDateChange={(e, dateName) => { onChangeText(e, dateName) }}  >
              </DatePicker>
            </View>
          </View>
        </Modal> */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    height: '100%',
    backgroundColor: '#fff',
    marginHorizontal: setWidth(40),
    marginTop: setHeight(30),
    marginBottom: setHeight(40),
    paddingBottom: setHeight(40),
    paddingHorizontal: setWidth(40),
    borderRadius: 5,
  },
  mainHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainHeaderTitle: {
    fontSize: setText(30),
    paddingTop: setHeight(30),
  },
  mainHeaderClose: {
    paddingLeft: setWidth(40),
    paddingTop: setHeight(30),
  },
  mainItem: {
    paddingTop: setHeight(20),
  },
  mainSpecial: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: setHeight(20),
  },
  mainSpecialItem: {
    width: setWidth(260),
  },
  mainInputTitle: {
    color: '#adb5bc',
    fontSize: setText(28),
  },
  mainInputValue: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    height: setHeight(93),
  },
  mainSwitch: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: setHeight(96),
    marginTop: setHeight(30),
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  mainSwitchTitle: {
    fontSize: setText(36),
  },
  switch: {
    transform: [{scaleX: 1.4}, {scaleY: 1.4}],
    width: setWidth(80),
    height: setHeight(40),
  },
  mainTextarea: {
    height: setHeight(172),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: setWidth(20),
    paddingVertical: setHeight(20),
  },
  // btnList: {
  //   display: 'flex',
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginTop: setHeight(30),
  // },
  btnView: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: setHeight(86),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: setHeight(30),
    // width: setWidth(265),
  },
  btnSpecialView: {
    backgroundColor: '#27d6ff',
    borderColor: '#27d6ff',
  },
  btnTitle: {
    fontSize: setText(36),
  },
  btnSpecialTitle: {
    color: '#fff',
  },
  btnSpecialTitle1: {
    color: '#adb5bc',
  },
  finishBtn: {
    height: setHeight(88),
    backgroundColor: '#27d6ff',
    borderRadius: 5,
    marginTop: setHeight(30),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateImage: {
    position: 'absolute',
    right: 0,
    bottom: setHeight(10),
    width: setWidth(35),
    height: setWidth(35),
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(52, 52, 52, 0.2)',
  },
  middleModal: {
    backgroundColor: '#fff',
    height: setHeight(480),
  },
  iconHeader: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  checkCircle: {
    textAlign: 'left',
    fontSize: setText(60),
    color: '#ccc',
  },
  closeCircle: {
    textAlign: 'right',
    fontSize: setText(60),
    color: '#ccc',
  },
});

export default JobInput;
