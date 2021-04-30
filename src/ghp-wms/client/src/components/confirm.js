import React, {Component} from 'react';
import {View, Text, Modal, StyleSheet, TouchableOpacity} from 'react-native';
import PropTypes from 'prop-types';
import * as Constant from '~/config/constants';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
class Confirm extends Component {
  static propTypes = {
    content: PropTypes.string,
    title: PropTypes.string,
    show: PropTypes.bool,
    type: PropTypes.oneOf(['error', 'success', 'info', 'confirm']),
    buttonConfig: PropTypes.object,
  };

  static defaultProps = {
    content: 'An unexpected error came up',
    title: 'Tips',
    show: false,
    type: 'error',
    buttonConfig: {},
  };
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    let {show, type, title, content, buttonConfig} = this.props;
    let buttonAction = buttonConfig.onPress;
    let leftPress = buttonConfig.leftPress;
    let rightPress = buttonConfig.rightPress;
    return (
      show && (
        <Modal
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}>
          <View style={styles.container}>
            <View style={styles.toastBox}>
              <View style={[{minHeight: title ? setHeight(200) : setHeight(140)}, styles.topArea]}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                <Text style={styles.content}>{content}</Text>
              </View>
              <View
                style={[
                  styles.footer,
                  {
                    justifyContent:
                      buttonConfig.leftText && buttonConfig.rightText
                        ? 'space-between'
                        : 'center',
                  },
                ]}>
                {buttonConfig.leftText && (
                  <TouchableOpacity>
                    <Text
                      style={[styles.btn, {color: '#666'}]}
                      onPress={() => {
                        leftPress && leftPress();
                      }}>
                      {buttonConfig.leftText || '取消'}
                    </Text>
                  </TouchableOpacity>
                )}
                {buttonConfig.rightText && (
                  <TouchableOpacity>
                    <Text
                      style={[
                        styles.btn,
                        {color: type !== 'error' ? '#0080dc' : '#ff1d25'},
                      ]}
                      onPress={() => {
                        rightPress && rightPress();
                      }}>
                      {buttonConfig.rightText || '确定'}
                    </Text>
                  </TouchableOpacity>
                )}

                {(buttonConfig.text ||
                  (!buttonConfig.leftText && !buttonConfig.rightText)) && (
                  <TouchableOpacity>
                    <Text
                      style={[
                        styles.btn,
                        {color: type !== 'error' ? '#0080dc' : '#ff1d25'},
                      ]}
                      onPress={() => {
                        buttonAction && buttonAction();
                      }}>
                      {buttonConfig.text || '确定'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBox: {
    width: '70%',
    position: 'absolute',
    zIndex: 101,
    backgroundColor: '#fff',
    borderRadius: setWidth(20),
  },
  topArea: {
    textAlignVertical: 'center',
  },
  title: {
    paddingTop: setHeight(20),
    fontSize: setText(Constant.defaultFont),
    textAlign: 'center',
  },
  content: {
    color: '#666',
    fontSize: setText(Constant.defaultFont * 0.8),
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#c1c7ea',
    flexDirection: 'row',
    paddingTop: setWidth(16),
    paddingBottom: setWidth(16),
    paddingLeft: setWidth(48),
    paddingRight: setWidth(48),
  },
  btn: {
    height: setHeight(60),
    textAlign: 'center',
    fontSize: setText(Constant.defaultFont),
    textAlignVertical: 'center',
  },
});

export default Confirm;
