import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { Actions } from 'react-native-router-flux';
import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import Styles from '~/assets/styles/base'
import config from '~/config/config'
import IbdToast from '~/components/IbdToast'

import Header from '../../components/Header';

class Configguration extends Component {

  constructor(props) {
    super(props);
    this.state = {
      httpValue: "",
      alertShow: false,
      alertTitle: "",
      alertContent: "",
      alertType: "error",
      httpInput: "",
      keyboardShown: true
    }

  }

  componentDidMount () {
    //获取配置相关的信息
    this.getConfig()
    //监听键盘弹出事件
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow',
      this.keyboardDidShowHandler.bind(this));
    //监听键盘隐藏事件
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide',
      this.keyboardDidHideHandler.bind(this));
  }

  componentWillUnmount () {
    //卸载键盘弹出事件监听
    if (this.keyboardDidShowListener != null) {
      this.keyboardDidShowListener.remove();
    }
    //卸载键盘隐藏事件监听
    if (this.keyboardDidHideListener != null) {
      this.keyboardDidHideListener.remove();
    }
  }

  //键盘弹出事件响应
  keyboardDidShowHandler () {
    this.setState({ keyboardShown: false });
  }

  //键盘隐藏事件响应
  keyboardDidHideHandler () {
    this.setState({ keyboardShown: true });
  }

  getConfig = async () => {
    let { http_url } = this.props
    http_url = await AsyncStorage.getItem('server_url') || config.baseUrl;
    this.setState({
      httpValue: http_url,
    })

  }

  // 返回
  back = () => {
    Actions.pop()//返回
  }

  /**
   * 测试连接或保存按钮
   * @param {*} num  0：测试连接，1保存弹框的确认按钮
   */


  testConnect (num) {
    const { testLink } = this.props;
    const { httpInput } = this.state;
    testLink({ http_url: httpInput }).then(res => {
      if (res.status === 200) {
        if (num === 0) {
          this.setState({
            alertShow: true,
            alertTitle: "",
            alertType: "success",
            alertContent: "测试成功!"
          })
        } else {
          this.saveConfig()
        }
      } else {
        this.setState({
          alertShow: true,
          alertTitle: "",
          alertType: "error",
          alertContent: "数据库连接失败,请检查设置!"
        })
      }
    }).catch(err => {
      this.setState({
        alertShow: true,
        alertTitle: "",
        alertType: "error",
        alertContent: "数据库连接失败,请检查设置!"
      })
    })

  }

  /**
   * 确认保存配置
   */
  saveConfig () {
    const { setConfig } = this.props
    const { httpInput } = this.state
    AsyncStorage.setItem('server_url', httpInput);
    setConfig({ http_url: httpInput })
    Actions.push('login')
  }

  /**
   * 确认弹框取消按钮
   */
  reset () {
    this.getConfig()
  }

  render () {
    const { httpValue, httpInput, alertContent, alertShow, alertTitle, alertType, keyboardShown } = this.state
    return (
      <View style={styles.container}>
        <Header leftTitle={'设置'} leftClick={() => this.back()} wrapStyle={styles.wrapStyle}></Header>
        <ScrollView style={styles.confArea}>
          <View style={styles.confItem}>
            <View>
              <Text style={[styles.title, { color: '#ccc' }]}>{"当前地址"}</Text>
              <TextInput
                multiline={true}
                editable={false}
                style={styles.value}
                value={httpValue}
                placeholder={"请输入"}
                onChangeText={(value) => { this.setState({ httpValue: value }) }}
              ></TextInput>
            </View>
            <View>
              <Text style={[styles.title, { color: httpInput ? '#ccc' : '#333' }]}>{"服务器地址"}</Text>
              <TextInput
                multiline={true}
                style={styles.value}
                value={httpInput}
                placeholder={"请输入"}
                onChangeText={(value) => { this.setState({ httpInput: value }) }}
              ></TextInput>
            </View>
          </View>
        </ScrollView>
        {
          keyboardShown === true ?
            <View
              style={styles.btnView}>
              <TouchableOpacity onPress={() => { this.testConnect(0) }}>
                <Text style={styles.testBtn}>{"连接"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { this.testConnect(1) }}>
                <Text style={styles.saveBtn}>{"保存"}</Text>
              </TouchableOpacity>

            </View> : null
        }

        {/* 提示框 */}
        <IbdToast show={alertShow} title={alertTitle} content={alertContent} type={alertType}
          buttonConfig={{
            text: "确认",
            onPress: () => {
              this.setState({
                alertShow: false
              })
            }
          }} ></IbdToast>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  btnView: {
    height: setHeight(98),
    backgroundColor: '#fff',
    display: "flex",
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom:setHeight(40),
    marginHorizontal:setWidth(40)
  },
  testBtn: {
    width: setWidth(380),
    height: '100%',
    backgroundColor: "#00bdf7",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: setText(42),
    color: "#fff",
    borderWidth: 1,
    borderColor: "#00bdf7",
    borderRadius: setWidth(5)
  },
  saveBtn: {
    width: setWidth(240),
    height: '100%',
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: setText(42),
    color: "#333333",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: setWidth(5)
  },

  confArea: {
    flex: 1,
    // marginLeft:setWidth(40),
    // marginRight:setWidth(40)
    marginHorizontal:setWidth(40)
  },
  confItem: {
    minHeight: setHeight(90)
  },
  title: {
    paddingTop: setWidth(20),
    fontSize: setText(30),
    color: "#999"
  },
  value: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    fontSize: setText(36),
    color: "#333"
  },
  wrapStyle:{
    ...Styles.blue
  }

})

const mapStateToProps = (state) => ({
  http_url: state.config.http_url || "",
});

const mapDispatchToProps = (dispatch) => ({
  setConfig: dispatch.config.setConfig,
  testLink: dispatch.config.testLink,
});

export default connect(mapStateToProps, mapDispatchToProps)(Configguration);

