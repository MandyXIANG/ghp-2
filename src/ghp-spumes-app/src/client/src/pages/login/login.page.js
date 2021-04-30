import React, { Component } from 'react';
import { Text, Switch, Item, Icon, Input } from 'native-base';//引入组件
import { StyleSheet, View, ImageBackground, ToastAndroid, TouchableOpacity, Image, Keyboard, BackHandler } from 'react-native';//引入组件
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import handlerOnceTap from '~/utils/handlerOnceTap.util';
import AsyncStorage from '@react-native-community/async-storage';

import { setHeight, setWidth, setText } from '~/utils/initSize.util'

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
      keyboardShown: true //设置按钮是否显示
    }
  }
  componentDidMount () {
    this.setrememberConfig()
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
      const loginData = JSON.parse(res)
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

  /**
 * 连续按两下退出程序
 */
  onBackHandler = () => {
    if (this.lastBackPress + 2000 >= Date.now()) {
      BackHandler.exitApp()
      return false
    }
  }

  render () {
    let { rememberConfig, username, password, keyboardShown } = this.state
    return (
      <ImageBackground
        style={styles.imageBg}
        source={imgList.loginbg}>
        <View style={styles.longinView}>
          <Image
            style={styles.title}
            source={imgList.title} />
          <Item>
            <Input
              placeholder={"用户名/邮箱"}
              placeholderTextColor='#00BDF7'
              style={styles.inputStyle}
              value={username}
              onChangeText={value => this.setState({ username: value })}
            />
            <Icon active name='person' style={styles.icon} />
          </Item>
          <Item>
            <Input
              placeholder={"密码"}
              placeholderTextColor='#00BDF7'
              style={styles.inputStyle}
              secureTextEntry={true}
              value={password}
              onChangeText={value => this.setState({ password: value })}
            />
            <Icon active name='lock' style={styles.icon} />
          </Item>
          <View style={styles.forgetBox}>
            <Text style={styles.forgetPwd}>{"记住密码"}</Text>
            <Switch
              style={styles.switch}
              trackColor={{ true: '#00bdf7' }}
              thumbColor='#ffffff'
              value={rememberConfig}
              onValueChange={value => this.setState({ rememberConfig: value })} />
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={() => this.loginBtn()}><Text style={styles.loginText}>{"登 录"}</Text></TouchableOpacity>
        </View>
        {
          keyboardShown === true ?
            <TouchableOpacity style={styles.settingBottom} onPress={() => { handlerOnceTap(() => Actions.push('configguration')) }}>
              <Image style={styles.settingIcon}
                source={imgList.settingIcon} />
            </TouchableOpacity>
            : null
        }
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
    width: setWidth(480),
    marginTop: setHeight(200),
    marginLeft: setWidth(60),
  },
  title: {
    width: setWidth(252),
    height: setHeight(72),
    marginBottom: setHeight(40),
  },
  inputStyle: {
    fontSize: setText(36),
    color: '#333333',
    marginBottom: setHeight(10),
  },
  icon: {
    color: '#d9d9d9',
    fontSize: setText(48),
  },
  forgetBox: {
    justifyContent: "space-between",
    flexDirection: 'row',
    alignItems: 'center',
    height: setHeight(80),
    marginTop: setHeight(40)
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
    width: setWidth(240),
    height: setHeight(98),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: setHeight(48)
  },
  loginText: {
    fontSize: setText(42),
    color: '#ffffff',
  },
  settingBottom: {
    width: setWidth(128),
    height: setHeight(128),
    position: 'absolute',
    bottom: 0,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIcon: {
    width: setWidth(48),
    height: setHeight(48)
  }
});

const mapStateToProps = (state) => ({
  userInfo: state.login.userInfo || {},
  userData: state.login.userData || {},
});

const mapDispatchToProps = (dispatch) => ({
  doLogin: params => dispatch.login.doLogin(params),
  remember: dispatch.login.remember,
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);







