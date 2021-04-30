import React, {Component} from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntIcon from 'react-native-vector-icons/AntDesign';

import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import * as Constant from '~/config/constants';

class Popover extends Component {
  static propTypes = {
    list: PropTypes.array,
    bgMode: PropTypes.bool,
    popoverAnchor: PropTypes.object,
    onClose: PropTypes.func,
    showPoper: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }
  onClose() {
    const {onClose} = this.props;
    if (onClose) {
      onClose();
    }
  }
  clikItem(item) {
    if (item.command) item.command();
  }
  render() {
    const {list, popoverAnchor, showPoper} = this.props;
    return (
      <View style={styles.bg}>
        <TouchableOpacity
          style={styles.container}
          onPress={() => {
            this.onClose();
          }}
        />
        <View style={styles.popContainer}>
          {/* <AntIcon style={styles.icon} size={setText(50)} name="caretup" /> */}
          {list.map((item, index) => {
            return (
              <TouchableOpacity onPress={() => this.clikItem(item)} key={index}>
                <View style={styles.item}>
                  <AntIcon size={setText(40)} name={item.icon} />
                  <Text style={styles.itemText}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bg: {
    position: 'absolute',
    zIndex:100
  },
  container: {
    width: Constant.ScreenWidth,
    height: Constant.ScreenHeight,
  },
  popContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: setWidth(300),
    marginRight: setWidth(16),
    borderRadius: setWidth(20),
    padding: setWidth(16),
    zIndex: 30,
    top: setHeight(130),
    right: setWidth(0),
    paddingBottom: setHeight(80),
  },
  icon: {
    position: 'absolute',
    color: '#fff',
    right: setWidth(10),
    top: setHeight(-35),
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    height: setHeight(90),
    alignItems: 'center',
  },
  itemText: {
    fontSize: setText(Constant.defaultFont),
    marginLeft: setWidth(16),
  },
});

export default Popover;
