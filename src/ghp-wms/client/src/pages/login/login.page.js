import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  Image,
  TextInput,
  Switch,
  TouchableOpacity,
  StatusBar,
  ToastAndroid,
  BackHandler,
  Modal,
} from 'react-native';
import {connect} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Actions} from 'react-native-router-flux';
import AsyncStorage from '@react-native-community/async-storage';
import axios from 'axios';

import Http from '~/utils/http';
import * as Constant from '~/config/constants';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import commonStyles from '~/assets/styles';
import IbdLoading from '~/components/ibdLoading';
import config from '~/config/config';

class Login extends Component {
  lastBackPress = Date.now();

  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      activeUser: false,
      activePwd: false,
      clickLogin: false,
      visibalModel: false,
      newUrl: '',
    };
  }

  componentDidMount() {
    this.setState({
      clickLogin: false,
      username: this.props.username,
      password: this.props.password,
    });
    BackHandler.addEventListener('hardwareBackPress', this.onBackHandler);
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackHandler);
  }
  /* *
   * 物理返回
   */
  onBackHandler = () => {
    if (Actions.currentScene == 'login' || Actions.currentScene == 'home') {
      if (this.lastBackPress && this.lastBackPress + 2000 >= Date.now()) {
        //最近2秒内按过back键，可以退出应用。
        BackHandler.exitApp();
        return false;
      }
      this.lastBackPress = Date.now();
      ToastAndroid.showWithGravityAndOffset(
        '再按一次退出应用',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        30,
      );
      return true; //默认行为
    }
  };
  userInputChange(text) {
    this.setState({username: text});
  }

  passwordChange(text) {
    this.setState({password: text});
  }
  /**
   * 登录
   * @returns
   */
  submit() {
    const {username, password, clickLogin} = this.state;
    const {remember} = this.props;
    const {doLogin} = this.props;
    if (clickLogin) {
      return;
    }
    if (!this.state.username.trim()) {
      ToastAndroid.showWithGravity(
        '请输入用户名',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    if (!this.state.password.trim()) {
      ToastAndroid.showWithGravity(
        '请输入用户密码',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
      return;
    }
    this.setState({
      clickLogin: true,
    });
    const params = {
      username,
      password,
      remember,
    };
    doLogin(params)
      .then(res => {
        this.setState({
          clickLogin: false,
        });
      })
      .catch(err => {
        this.setState({
          clickLogin: false,
        });
      });
  }
  /**
   * 记住密码
   * @param {*} t
   */
  doRemember(t) {
    let {doRemember} = this.props;
    let {username, password} = this.state;
    let data = {};
    if (t) {
      data = {
        remember: t,
        username: username,
        password: password,
      };
    }
    doRemember(data);
  }
  /**
   * 点击改变地址的区域
   */
  changeUrl = async () => {
    let url = (await AsyncStorage.getItem('server_url')) || '';
    this.setState({
      visibalModel: true,
      newUrl: url,
    });
  };
  onChangeUrl(text) {
    this.setState({
      newUrl: text,
    });
  }

  /**
   * 保存新的地址
   */
  saveUrl() {
    const {newUrl} = this.state;
    this.testLink(newUrl)
      .then(res => {
        if (res.status === 200) {
          //测试通过
          AsyncStorage.setItem('server_url', newUrl);
          ToastAndroid.showWithGravityAndOffset(
            '修改成功',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
            0,
            30,
          );
          this.setState({
            visibalModel: false,
          });
        } else {
          ToastAndroid.showWithGravityAndOffset(
            '地址不正确',
            ToastAndroid.SHORT,
            ToastAndroid.TOP,
            0,
            30,
          );
        }
      })
      .catch(err => {
        ToastAndroid.showWithGravityAndOffset(
          '地址不正确',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
          0,
          30,
        );
      });
  }

  /**
   * 取消修改
   */

  cancelUrl() {
    this.setState({
      visibalModel: false,
    });
  }

  /**
   * 测试连接
   * @param {*} url
   * @returns
   */
  testLink(url) {
    return new Promise((resolve, reject) => {
      axios
        .get(`${url}/system/getDatabaseConfig`)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
  render() {
    let {
      activePwd,
      activeUser,
      password,
      username,
      clickLogin,
      visibalModel,
      newUrl,
    } = this.state;
    let {remember} = this.props;
    return (
      <View style={styles.loginConatiner}>
        <StatusBar hidden={true} />
        <IbdLoading show={clickLogin} />
        <ImageBackground
          source={require('../../assets/images/login_bg.png')}
          style={styles.bg}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/images/login_logo1.png')}
              style={styles.logoImg}
            />
          </View>
          <View style={styles.appTitle}>
            <Text style={styles.appTitleText}> TOPWMSOOO </Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              value={username}
              onChangeText={e => this.userInputChange(e)}
              style={[
                styles.input,
                styles.inputActive,
                {borderBottomWidth: activeUser ? 2 : 0},
              ]}
              onBlur={() =>
                this.setState({activeUser: false, activePwd: false})
              }
              onFocus={() =>
                this.setState({activeUser: true, activePwd: false})
              }
            />
            <Icon
              name={'user'}
              color="#FFF"
              size={setText(40)}
              style={styles.inputIcon}
            />
          </View>
          <View style={styles.inputBox}>
            <TextInput
              value={password}
              onChangeText={e => this.passwordChange(e)}
              secureTextEntry={true}
              style={[
                styles.input,
                styles.inputActive,
                {borderBottomWidth: activePwd ? 2 : 0},
              ]}
              onBlur={() =>
                this.setState({activePwd: false, activeUser: false})
              }
              onFocus={() =>
                this.setState({activePwd: true, activeUser: false})
              }
            />
            <Icon
              name={'unlock-alt'}
              color="#FFF"
              size={setText(40)}
              style={styles.inputIcon}
            />
          </View>
          <View style={styles.checkbox}>
            <Switch
              trackColor="red"
              value={remember}
              onValueChange={t => this.doRemember(t)}
            />
            <Text style={{color: '#FFF'}}> 记住密码 </Text>
          </View>
          <View style={commonStyles.centered}>
            <TouchableOpacity
              style={styles.submit}
              onPress={() => this.submit()}>
              <Text style={styles.loginText}>登 录</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              this.changeUrl();
            }}
            style={styles.settingArea}
          />
          {visibalModel && (
            <Modal
              animationType="fade"
              transparent={true}
              onRequestClose={() => {}}>
              <View style={styles.settingContainer}>
                <View style={styles.settingBox}>
                  <Text style={styles.settingTitle}>设置</Text>
                  <Text style={styles.defaultUrl}>默认:{config.baseUrl}</Text>
                  <TextInput
                    style={styles.newUrl}
                    placeholder="请输入服务器地址"
                    value={newUrl}
                    onChangeText={text => this.onChangeUrl(text)}
                  />
                  <View style={styles.btn}>
                    <TouchableOpacity
                      style={styles.btnBox}
                      onPress={() => this.cancelUrl()}>
                      <Text style={styles.cancelBtn}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnBox}
                      onPress={() => {
                        this.saveUrl();
                      }}>
                      <Text style={styles.okBtn}>确认</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loginConatiner: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },
  appTitle: {
    marginTop: setHeight(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitleText: {
    fontSize: setText(50),
    color: '#FFF',
  },
  logoBox: {
    marginTop: Constant.ScreenHeight * 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: setWidth(280),
    height: setHeight(280),
  },
  inputBox: {
    paddingHorizontal: setWidth(60),
    marginTop: setHeight(40),
  },
  input: {
    width: '100%',
    height: setHeight(100),
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: setWidth(6),
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    paddingLeft: setWidth(100),
    fontSize: setText(Constant.defaultFont),
    color: '#FFF',
  },
  inputActive: {
    borderBottomColor: '#32aff2',
    borderBottomWidth: setWidth(2),
  },
  inputIcon: {
    position: 'absolute',
    left: setWidth(100),
    top: setHeight(30),
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: setWidth(300),
    height: setHeight(50),
    paddingLeft: setWidth(80),
    marginTop: setHeight(20),
  },
  submit: {
    width: setWidth(600),
    height: setHeight(100),
    backgroundColor: Constant.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: setWidth(5),
    marginTop: setHeight(30),
  },
  loginText: {
    color: '#fff',
    fontSize: setText(Constant.defaultFont),
  },
  settingArea: {
    position: 'absolute',
    zIndex: 10,
    width: setWidth(200),
    height: setHeight(200),
    top: 0,
    right: 0,
  },
  settingContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingBox: {
    width: '80%',
    minHeight: setHeight(400),
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: setWidth(16),
  },
  settingTitle: {
    height: setHeight(50),
    fontSize: setText(Constant.defaultFont),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  defaultUrl: {
    fontSize: setText(Constant.defaultFont),
    marginBottom: setWidth(16),
  },
  newUrl: {
    fontSize: setText(Constant.defaultFont),
    height: setHeight(80),
    borderWidth: 1,
    borderColor: Constant.borderColor,
    borderRadius: 5,
    paddingLeft: setWidth(16),
  },
  btn: {
    height: setHeight(80),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: setWidth(32),
    paddingRight: setWidth(32),
  },
  btnBox: {
    width: '30%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    fontSize: setText(Constant.defaultFont),
  },
  okBtn: {
    fontSize: setText(Constant.defaultFont),
    color: Constant.primaryColor,
  },
});

const mapStateToProps = state => ({
  userInfo: state.login.userInfo || {},
  remember: state.login.remember || null,
  username: state.login.username || '',
  password: state.login.password || '',
});

const mapDispatchToProps = dispatch => ({
  doLogin: params => dispatch.login.doLogin(params),
  doRemember: dispatch.login.remember,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);
