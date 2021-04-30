import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text, View, Modal, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView } from 'react-native';
import Styles from '../assets/styles/base'
import { setHeight, setWidth, setText } from '~/utils/initSize.util';

class CheckModal extends Component {
  static propTypes = {
    isVisible: PropTypes.bool, // 是否显示模态框
    isCheck: PropTypes.bool, //是否检验数量
    inspectionList: PropTypes.array, //不良项数量
    isLeft: PropTypes.bool, //是否显示审核人
    checkQuantity: PropTypes.string, //检验数量
    total: PropTypes.number, //总计
    partnumber: PropTypes.string, //物料编码
    lotNo: PropTypes.string,//批次号
    username: PropTypes.string, //当前员工
    checkUser: PropTypes.string  //审核人
  };

  static defaultProps = {
    isVisible: false,
    isCheck: false,
    tinspectionListitle: [],
    isLeft: false,
    checkQuantity: '0',
    total: 0,
    partnumber: '',
    lotNo: '',
    username: '',
    checkUser: ''
  };
  constructor(props) {
    super(props);
    this.state = {
      imageList: {
        empty1: require('../assets/images/empty1.png'),
      },
      isFocus: false
    }
  }
  componentDidMount () {
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return;
    }
  }


  render () {
    const { isVisible, isCheck, inspectionList, confirmBtn, editBtn, cancelBtn, isLeft, changeCheckQuantity, checkQuantity, total, partnumber, lotNo, username, checkUser, changeCheckUser } = this.props

    return (
      <Modal
        animationType="fade"// 弹出动画效果
        transparent={true}// 背景是否透明
        visible={isVisible}// 决定modle是否显示
        onRequestClose={() => { // 手机物理返回  必填
          this.setState({ isVisible: !isVisible })
        }}
      >
        {/* <KeyboardAvoidingView > */}
        <KeyboardAvoidingView style={[styles.modalBg, Styles.columnCenter]} behavior="height" keyboardVerticalOffset={isCheck ? setHeight(350) : isLeft ? -setHeight(500) : 0}>
          <View style={styles.middleModal}>
            <View style={isLeft ? { height: setHeight(865) } : isCheck ? { height: setHeight(780) } : { height: setHeight(865) }}>
              <Text style={styles.midalTitle}>提审</Text>
              {/* 上 */}
              <View style={styles.midalHeader}>
                {/* 左边 */}
                {
                  isLeft ? <View style={styles.midalHeaderLeft}>
                    <Text style={styles.midalHeaderLeftTitle}>审核人</Text>
                    <TextInput style={styles.checkQuantityValue} onChangeText={(value) => changeCheckUser(value)} value={checkUser}></TextInput>
                  </View> : null
                }

                {/* 右边 */}
                <View style={styles.midalHeaderRight}>
                  <View style={styles.madalHeaderPartnumber}>
                    <Text style={[styles.midalHeaderTitle]}>物料编码</Text>
                    <Text style={[styles.midalHeaderValue]}>{partnumber}</Text>
                  </View>
                  <View style={styles.madalHeaderRightBottom}>
                    <View style={styles.midalHeaderLotNo}>
                      <Text style={[styles.midalHeaderTitle]}>批次号</Text>
                      <Text style={[styles.midalHeaderValue]}>{lotNo}</Text>
                    </View>
                    <View style={styles.midalHeaderUser}>
                      <Text style={[styles.midalHeaderTitle]}>当前员工</Text>
                      <Text style={[styles.midalHeaderValue]}>{username}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* 中 */}
              <View style={styles.midalTotal}>
                <Text style={styles.midalTotalTitle}>总计</Text>
                <Text style={styles.midalTotalTitle}>{total}</Text>
              </View>
              <View style={styles.midalInspectionMain}>
                <FlatList ListEmptyComponent={() => this.emptyComponent()}
                  keyExtractor={(item, index) => index.toString()}
                  data={inspectionList}
                  numColumns={4}
                  horizontal={false}
                  renderItem={({ item, index }) => this.renderItem(item, index)}
                >
                </FlatList>
              </View>
            </View>
            {/* 下 */}
            {
              isCheck ?
                <View style={styles.checkQuantity}>
                  <Text style={styles.checkQuantityTitle}>检验数量</Text>
                  <TextInput
                    style={styles.checkQuantityValue}
                    keyboardType="numeric"
                    onChangeText={(value) => changeCheckQuantity(value)}
                    value={checkQuantity}
                  ></TextInput>
                </View>
                : null
            }
            <View style={styles.midalBtnList}>
              <TouchableOpacity onPress={() => confirmBtn()}>
                <Text style={styles.midalBtnView}>确定</Text>
              </TouchableOpacity>
              {
                isLeft ? <TouchableOpacity onPress={() => editBtn()}>
                  <Text style={styles.midalBtnView}>修改</Text>
                </TouchableOpacity> : null
              }
              <TouchableOpacity onPress={() => cancelBtn()}>
                <Text style={[styles.midalBtnView, styles.midalBtnViewCancel]}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        {/* </KeyboardAvoidingView> */}

      </Modal>

    )
  }
  emptyComponent = () => {
    const { imageList } = this.state
    return (
      <View style={{ alignItems: 'center', marginTop: setHeight(90) }}>
        <View style={{ width: setWidth(288), height: setHeight(330) }}>
          <Image source={imageList.empty1} style={{ width: '100%', height: '100%' }}></Image>
        </View>
      </View>
    )
  }
  renderItem = (item, index) => {
    const { isLeft } = this.props
    return (
      <View style={[
        styles.midalInspectionItem,
        4 * index < 16 || (4 * index >= 32 && 4 * index < 48) || 4 * index >= 64 ? styles.midalInspectionEvenItem : styles.midalInspectionOddItem
      ]}>
        <Text style={styles.midalInspectionItemTitle}>{item.value}</Text>
        {/* '#ff4d4d' */}
        <Text style={[styles.midalInspectionItemTitle, isLeft && item.count - 0 > 0 ? { color: '#ff4d4d' } : null]}>{item.count}</Text>
      </View>
    )
  }
}


const styles = StyleSheet.create({
  modalBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1
    // paddingBottom:setHeight(2000)
  },
  middleModal: {
    width: setWidth(1400),
    backgroundColor: '#fff',
    height: setHeight(1000),
    borderRadius: 5
  },

  midalTitle: {
    height: setHeight(96),
    color: '#333',
    fontSize: setText(42),
    textAlign: "center",
    lineHeight: setHeight(96)
  },
  midalHeader: {
    flexDirection: 'row',
    marginHorizontal: setWidth(30),
    height: setHeight(144)
  },
  midalHeaderLeft: {
    borderWidth: 1,
    borderColor: '#0080dc',
    width: setWidth(400),
    borderRadius: 5,
    marginRight: setWidth(20),
    paddingHorizontal: setWidth(40),
    paddingVertical: setHeight(20)
  },
  midalHeaderLeftTitle: {
    fontSize: setText(28),
    color: '#0080dc'
  },
  midalHeaderRight: {
    backgroundColor: '#0080dc',
    flex: 1,
    borderRadius: 5,
    paddingHorizontal: setWidth(40),
  },
  madalHeaderPartnumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: setHeight(20)
  },
  madalHeaderRightBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  midalHeaderLotNo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  midalHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    width: setWidth(280),
  },
  midalTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: setWidth(30),
    height: setHeight(96)
  },
  midalTotalTitle: {
    color: '#0080dc',
    fontSize: setText(42)
  },
  midalHeaderTitle: {
    fontSize: setText(28),
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: setWidth(30),
    width: setWidth(120),
  },
  midalHeaderValue: {
    fontSize: setText(36),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  /**不良项 */
  midalInspectionMain: {
    borderTopColor: '#ccc',
    borderBottomColor: '#ccc',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flex: 1
  },
  midalInspectionItem: {
    paddingHorizontal: setWidth(30),
    height: setHeight(104),
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '25%',
    alignItems: 'center'
  },
  midalInspectionItemTitle: {
    fontSize: setText(36),
    color: '#333'
  },
  /**单数 */
  midalInspectionOddItem1: {
    backgroundColor: 'rgba(0,0,0,.7)',
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 'auto',
    display: 'none'
  },
  midalInspectionOddItem: {
    backgroundColor: '#fff'
  },
  /**双数 */
  midalInspectionEvenItem: {
    backgroundColor: '#f4f4f4',

  },
  midalBtnList: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: setHeight(20)
  },
  midalBtnView: {
    color: '#fff',
    paddingHorizontal: setWidth(60),
    paddingVertical: setHeight(20),
    marginHorizontal: setWidth(10),
    fontSize: setText(36),
    backgroundColor: '#0080dc',
    borderRadius: 5,
    borderColor: '#0080dc',
    borderWidth: 1,
  },
  midalBtnViewCancel: {
    backgroundColor: '#fff',
    color: '#0080dc'
  },
  checkQuantity: {
    paddingHorizontal: setWidth(30),
    flexDirection: 'row',
    paddingVertical: setHeight(10)
  },
  checkQuantityTitle: {
    fontSize: setText(42),
    color: '#0080dc',
    paddingRight: setWidth(20)
  },
  checkQuantityValue: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    width: setWidth(320),
    fontSize: setText(36),
    color: '#333'
  }
})

export default CheckModal