import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Text } from 'native-base';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign'

import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import Styles from '~/assets/styles/base'

const Header = (props) => {
  const {
    leftClick,
    leftIcon,
    rightClick,
    rightIcon,
    leftTitle,
    rightTitle,
    leftStyle,
    titleStyle,
    rightStyle,
    wrapStyle,
    confirmDisable,
    leftName,
    rightName,
    rightFlag
  } = props
  return (
    <View style={[styles.header, wrapStyle]}>
      <TouchableOpacity onPress={() => leftClick()}>
        <View style={[styles.left, leftStyle]}>
          <Icon name={leftName ? leftName : 'left'} size={setText(36)} color="#fff" />
        </View>
      </TouchableOpacity>
      <View style={styles.titleBox}>
        <Text style={styles.title}>{leftTitle}</Text>
        <Text style={styles.title}>{rightTitle}</Text>
      </View>

      {
        rightFlag &&
        <TouchableOpacity onPress={() => rightClick(confirmDisable)}>
          <View style={[styles.right, rightStyle]}>
            <Icon size={setText(36)} name={rightName ? rightName : 'right'} color={confirmDisable ? '#aaa' : '#fff'} />
          </View>
        </TouchableOpacity>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    ...Styles.rowCenter,
    // ...Styles.blue,
    height: setHeight(98),
  },
  left: {
    ...Styles.rowCenter,
    width: setWidth(64),
    height: '100%',
    marginLeft: setWidth(20),
    marginRight: setWidth(20)
  },
  titleBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: setText(36),
  },
  right: {
    ...Styles.rowCenter,
    width: setWidth(76),
    height: '100%',
    marginLeft: setWidth(20),
    marginRight: setWidth(20)
  }
})


export default Header