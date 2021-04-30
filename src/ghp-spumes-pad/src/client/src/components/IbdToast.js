import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { setHeight, setWidth, setText } from '~/utils/initSize.util';
import { Title } from 'native-base';


class IbdToast extends Component {

  static propTypes = {
    content: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.oneOf(['error', 'success', 'info']),
    show: PropTypes.bool,
    buttonConfig: PropTypes.object,
  };

  static defaultProps = {
    content: 'An unexpected error came up',
    title: 'Tips',
    type: 'error',
    show: false,
    buttonConfig: {}
  };
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  componentDidMount() {

  }
  render() {
    let { show, title, type, content, buttonConfig } = this.props;
    let buttonAction = buttonConfig.onPress;
    return (
      show &&
      <Modal transparent={true}
        onRequestClose={() => { 
        }}>
        <View style={styles.ibdToastContainer}>
          <View style={styles.toastBox}>
            <View style={[{ height: title ? 140 : 120 }, styles.topArea]}>
              {
                title ?
                  <Text style={styles.title}>{title}</Text>
                  : null

              }
              <Text style={styles.content}>{content}</Text>
            </View>
            <Text style={[styles.footer, { color: type === "success" ? '#0080dc' : "#ff1d25" }]}
              onPress={() => {
                buttonAction && buttonAction()
              }}>{buttonConfig.text}</Text>
          </View>
        </View>
      </Modal >
    );
  }
}


const styles = StyleSheet.create({
  ibdToastContainer: {
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
    width: setWidth(380),
    position: 'absolute',
    zIndex: 101,
    backgroundColor: '#fff',

  },
  topArea: {

    textAlignVertical: 'center',
  },
  title: {
    paddingTop: setHeight(20),
    color: "#666",
    fontSize: setText(24),
    textAlign: 'center',
    height: setHeight(50)

  },
  content: {
    color: "#333",
    fontSize: setText(24),
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  footer: {
    height: setHeight(80),
    textAlign: 'center',
    fontSize: setText(26),
    textAlignVertical: 'center',
    borderTopWidth: 1,
    borderColor: "#c1c7ea"
  }
})




export default IbdToast;
