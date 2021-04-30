import React, { Component } from 'react';
import { Text, Switch, Item, Icon, Input } from 'native-base';//引入组件
import { StyleSheet, View, ImageBackground, ToastAndroid, TouchableOpacity, Image, Keyboard, BackHandler, Modal, TextInput } from 'react-native';//引入组件
import { connect } from 'react-redux'
import handlerOnceTap from '~/utils/handlerOnceTap.util';
import AsyncStorage from '@react-native-community/async-storage';

import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import IbdToast from '~/components/IbdToast'
import config from '~/config/config'

const imgList = {
  loginbg: require('~/assets/images/loginbg.png'),
  title: require('~/assets/images/TopMESLogin.png'),
  settingIcon: require('~/assets/images/settingIcon.png')
}

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rememberConfig: false,//记住密码配置
      username: '',//用户名
      password: '',//用户密码
      keyboardShown: true, //设置按钮是否显示
      showConfig: false,
      httpValue: '',
      httpInput: '',
      alertShow: false, // 提示框
      alertTitle: '',
      alertContent: '',
      alertType: 'error'
    }
  }
  componentDidMount () {
    this.setrememberConfig()
    this.getConfig()
    //监听键盘弹出事件
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow',
      this.keyboardDidShowHandler.bind(this));
    //监听键盘隐藏事件
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide',
      this.keyboardDidHideHandler.bind(this));
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onBackHandler)
    }
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
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.onBackHandler)
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

  //记住密码判断是否回填数据
  setrememberConfig = () => {
    AsyncStorage.getItem('userData').then(res => {
      const loginData = JSON.parse(res) || {}
      if (loginData.rememberConfig) {
        this.setState({
          username: loginData.username,
          password: loginData.password,
          rememberConfig: loginData.rememberConfig
        })
      } else {
        this.setState({
          username: '',
          password: ''
        })
      }
    })
  }

  // 登录
  loginBtn = () => {
    const { rememberConfig, username, password } = this.state;
    const { doLogin } = this.props;
    if (!this.state.username || !this.state.password) {
      ToastAndroid.showWithGravity('请输入用户名密码', ToastAndroid.SHORT, ToastAndroid.TOP);
      return
    }
    const params = {
      username,
      password,
      rememberConfig
    }
    doLogin(params)
  }

  // 连按两下退出程序
  onBackHandler = () => {
    if (this.lastBackPress + 2000 >= Date.now()) {
      BackHandler.exitApp()
      return true
    }
  }

  // 获取地址数据
  getConfig = async () => {
    let { http_url } = this.props
    http_url = await AsyncStorage.getItem('server_url') || config.baseUrl;
    this.setState({
      httpValue: http_url,
    })

  }

  // 链接或保存按钮 0 链接 1 保存
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

  // 确认保存设置
  saveConfig () {
    const { setConfig } = this.props
    const { httpInput } = this.state
    AsyncStorage.setItem('server_url', httpInput);
    setConfig({ http_url: httpInput })
    this.setState({showConfig: false})
  }

  render () {
    let { rememberConfig, username, password, keyboardShown, showConfig, httpValue, httpInput, alertShow, alertTitle, alertContent, alertType} = this.state
    return (
      <ImageBackground style={styles.imageBg} source={imgList.loginbg}>
        <View style={styles.longinView}>
          <Image style={styles.title} source={imgList.title} />
          <Item>
            <Input placeholder={"用户名/邮箱"} placeholderTextColor='#00BDF7'
                   style={styles.inputStyle} value={username}
                   onChangeText={value => this.setState({ username: value })}/>
            <Icon active name='person' style={styles.icon} />
          </Item>
          <Item>
            <Input placeholder={"密码"} placeholderTextColor='#00BDF7'
                   style={styles.inputStyle} secureTextEntry={true}
                   value={password} onChangeText={value => this.setState({ password: value })}/>
            <Icon active name='lock' style={styles.icon} />
          </Item>
          <View style={styles.forgetBox}>
            <Text style={styles.forgetPwd}>{"记住密码"}</Text>
            <Switch style={styles.switch} trackColor={{ true: '#00bdf7' }}
                    thumbColor='#ffffff' value={rememberConfig}
                    onValueChange={value => this.setState({ rememberConfig: value })} />
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={() => this.loginBtn()}><Text style={styles.loginText}>{"登 录"}</Text></TouchableOpacity>
        </View>
        {
          keyboardShown === true ?
            <TouchableOpacity style={styles.settingBottom} onPress={() => { handlerOnceTap(() => this.setState({showConfig: true})) }}>
              <Image style={styles.settingIcon} source={imgList.settingIcon} />
            </TouchableOpacity>
            : null
        }
        {/* url设置弹框 */}
        {
          <Modal onRequestClose={() => { this.setState({ showConfig: !showConfig }) }} visible={showConfig} transparent={true} animationType='fade'>
            <View style={styles.modalMain}>
              <View style={styles.modalContainer}>
                <View style={styles.urlText}>

                      <Text style={styles.urlTextMsg}>URL设置</Text>
                </View>
                <View style={[styles.urlInput, styles.firstUrlInput]}>
                    <Text style={[styles.urlTitle, { color: '#999999' }]}>当前地址</Text>
                    <TextInput multiline={true} editable={false} style={styles.nowUrl}
                               value={httpValue} placeholder={"请输入"}
                              onChangeText={(value) => { this.setState({ httpValue: value }) }}/>
                    
                </View>
                <View style={[styles.urlInput, styles.secondUrlInput]}>
                    <Text style={[styles.urlTitle, { color: httpInput ? '#0080dc' : '#999999' }]}>服务器地址</Text>
                    <TextInput multiline={true} style={styles.nowUrl}
                                value={httpInput} placeholder={"请输入"}
                                onChangeText={(value) => { this.setState({ httpInput: value }) }}/>
                </View>
                {
                  keyboardShown === true ?
                    <View style={styles.btnView}>
                      <View style={styles.btnList}>
                          <TouchableOpacity onPress={() => { this.testConnect(0) }}>
                            <Text style={[styles.testBtn, {marginRight: setWidth(30)}]}>{"连接"}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { this.testConnect(1) }}>
                            <Text style={[styles.testBtn, {marginRight: setWidth(30)} ]}>{"保存"}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { this.setState({showConfig: false})}}>
                            <Text style={[styles.testBtn, {backgroundColor: '#ffffff', color: '#0080dc'}]}>{"取消"}</Text>
                          </TouchableOpacity>
                      </View>
                    </View> : null
                }
              </View>
            </View>
        </Modal>
        }
        <IbdToast show={alertShow} title={alertTitle} content={alertContent} type={alertType}
                  buttonConfig={{ text: "确认", onPress: () => { this.setState({alertShow: false }) } }}>
        </IbdToast>
      </ImageBackground>
    )
  }
}

const styles = StyleSheet.create({
  imageBg: {
    flex: 1,
    resizeMode: "cover",
  },
  longinView: {
    width: setWidth(800),
    marginTop: setHeight(240),
    marginLeft: setWidth(240),
  },
  title: {
    width: setWidth(256),
    height: setHeight(72),
    marginBottom: setHeight(80),
  },
  inputStyle: {
    fontSize: setText(36),
    color: '#333333',
    marginBottom: setHeight(20),
  },
  icon: {
    color: '#d9d9d9',
    width: setWidth(48),
    height: setHeight(48)
  },
  forgetBox: {
    justifyContent: "space-between",
    flexDirection: 'row',
    alignItems: 'center',
    height: setHeight(98),
    marginVertical : setHeight(30),
  },
  forgetPwd: {
    fontSize: setText(36),
    color: '#333333',
  },
  switch: {
    transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }],
    width: setWidth(80),
    height: setHeight(40)
  },
  loginBtn: {
    backgroundColor: '#00bdf7',
    borderRadius: setHeight(50),
    width: setWidth(320),
    height: setHeight(98),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: setText(42),
    color: '#ffffff',
  },
  settingBottom: {
    width: setWidth(288),
    height: setHeight(208),
    position: 'absolute',
    bottom: 0,
    alignSelf: 'flex-end',
    paddingTop: setHeight(80),
    paddingLeft: setHeight(120),
  },
  settingIcon: {
    width: setWidth(48),
    height: setHeight(48)
  },
  modalMain: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContainer: {
    width: setWidth(1720),
    height: setHeight(560),
    backgroundColor: '#fff',
    borderRadius: setWidth(10)
  },
  urlText: {
    height: setHeight(98),
    borderBottomWidth: setWidth(1),
    borderBottomColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: setWidth(10)
  },
  urlTextMsg: {
    color: '#333333',
    fontSize: setText(42)
  },
  urlInput: {
    height: setHeight(116),
    borderBottomColor: "#cccccc",
    borderBottomWidth: setWidth(1),
    marginHorizontal: setWidth(40),
  },
  firstUrlInput: {
    marginTop: setHeight(20),
  },
  secondUrlInput: {
    marginTop: setHeight(30),
  },
  urlTitle: {
    fontSize: setText(28),
  },
  nowUrl: {
    fontSize: setText(36),
    color: "#333333"
  },
  btnView: {
    height: setHeight(140),
    marginTop: setHeight(40),
    borderTopColor: '#cccccc',
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnList: {
    flexDirection: 'row',
  },
  testBtn: {
    width: setWidth(240),
    height: setHeight(80),
    backgroundColor: "#0080dc",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: setText(36),
    color: "#fff",
    borderWidth: 1,
    borderColor: "#0080dc",
    borderRadius: setWidth(5)
  },
});

const mapStateToProps = (state) => ({
  userInfo: state.login.userInfo || {},
  userData: state.login.userData || {},
});

const mapDispatchToProps = (dispatch) => ({
  doLogin: params => dispatch.login.doLogin(params),
  remember: dispatch.login.remember,
  testLink: dispatch.config.testLink,
  setConfig: dispatch.config.setConfig,
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);







