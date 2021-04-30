import React, {Component} from 'react';
import {
  Text,
  ImageBackground,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  BackHandler,
  DeviceEventEmitter,
} from 'react-native';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import {connect} from 'react-redux';
import {Actions} from 'react-native-router-flux';

import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import * as Constant from '~/config/constants';
import config from '../../../package.json';

class Mine extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.back);
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.back);
  }

  logout() {
    Actions.push('login');
  }

  back = () => {
    DeviceEventEmitter.emit('home');
    Actions.pop();
  };
  render() {
    const {username} = this.props;
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/images/warehousebg-01.png')}
          style={styles.top}>
          <TouchableOpacity
            onPress={() => {
              this.back();
            }}
            style={styles.header}>
            <FontAwesomeIcon
              name={'angle-left'}
              size={setText(80)}
              color="#fff"
            />
            <Text style={styles.headertext}>我的</Text>
          </TouchableOpacity>
          <View style={styles.user}>
            <Image
              style={styles.logo}
              source={require('../../assets/images/logo.png')}
            />
            <Text style={styles.headertext}>Hi,{username}</Text>
          </View>
        </ImageBackground>

        <View style={styles.btm}>
          <View>
            <TouchableOpacity style={styles.item}>
              <Text style={styles.itemText}>当前版本</Text>
              <Text style={styles.itemText}>{config.version}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.logout}>
            <TouchableOpacity
              onPress={() => this.logout()}
              style={styles.logoutBtn}>
              <Text style={styles.logouttext}>退出登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {},
  top: {
    width: '100%',
    height: setHeight(500),
  },
  btm: {},
  logo: {
    width: setWidth(200),
    height: setHeight(200),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: setWidth(16),
  },
  headertext: {
    color: '#fff',
    fontSize: setText(Constant.defaultFont),
    marginLeft: setWidth(16),
  },
  user: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logout: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: setHeight(100),
    borderBottomColor: '#e8e8e8',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    padding: setHeight(16),
  },
  itemText: {
    fontSize: setText(Constant.defaultFont),
  },
  logoutBtn: {
    width: '100%',
    height: setHeight(100),
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: setWidth(5),
  },
  logouttext: {
    color: '#DD5246',
    fontSize: setText(Constant.defaultFont),
  },
});

const mapStateToProps = state => ({
  username: state.login.username || '',
});

const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Mine);
