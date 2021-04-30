import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  View,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/AntDesign';
import {Actions} from 'react-native-router-flux';

import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import * as Constant from '~/config/constants';

class Topbar extends Component {
  static propTypes = {
    bgMode: PropTypes.bool,
    plus: PropTypes.bool,
    rightText: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    leftText: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    leftPress: PropTypes.func, //默认是返回上一页面
    plusPress: PropTypes.func,
  };
  constructor(props) {
    super(props);
    this.state = {};
  }

  leftPress() {
    const {leftPress} = this.props;
    if (leftPress) leftPress();
    else Actions.pop();
  }

  plusPress(event) {
    const {plusPress} = this.props;
    if (plusPress) {
      plusPress();
    }
  }

  renderContent() {
    const {rightText, leftText, plusPress, plus, bgMode} = this.props;
    let textColor = bgMode ? '#FFF' : '#000';
    return (
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={{
              width: setWidth(60),
              height: setHeight(80),
            }}
            onPress={() => this.leftPress()}>
            <FontAwesomeIcon
              name={'angle-left'}
              size={setText(80)}
              color={textColor}
            />
          </TouchableOpacity>
          <Text style={[styles.leftText, {color: textColor}]}>
            {leftText || '返回'}
          </Text>
        </View>
        <View style={styles.rightContainer}>
          <Text style={[styles.rightText, {color: textColor}]}>
            {rightText}
          </Text>
          {plus && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={e => this.plusPress(e)}>
              <Icon
                name={'plus'}
                size={setText(60)}
                color={textColor || '#000'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
  render() {
    const {bgMode} = this.props;

    return bgMode ? (
      <ImageBackground
        source={require('~/assets/images/login_bg.png')}
        style={styles.bg}>
        {this.renderContent()}
      </ImageBackground>
    ) : (
      <View style={styles.bg}>{this.renderContent()}</View>
    );
  }
}
const styles = StyleSheet.create({
  bg: {
    width: Constant.ScreenWidth,
    height: setHeight(150),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,.2)',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftContainer: {
    width: Constant.ScreenWidth * 0.5,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: setWidth(16),
  },
  leftText: {
    fontSize: setText(Constant.defaultFont),
  },
  rightContainer: {
    height: '100%',
    width: Constant.ScreenWidth * 0.5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: setWidth(16),
  },
  rightText: {
    fontSize: setText(Constant.defaultFont) * 0.8,
  },
  rightIcon: {
    width: setWidth(60),
    height: setHeight(80),
    marginLeft: setWidth(16),
  },
  app: {
    ...StyleSheet.absoluteFillObject,
    padding: 10,
    backgroundColor: '#c2ffd2',
    alignItems: 'center',
  },
});
export default Topbar;
