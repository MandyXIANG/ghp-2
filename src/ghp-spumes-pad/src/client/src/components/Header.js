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
    rightFlag,
    rightBtnName,
    rightSublim
  } = props
  return (
    <View style={[styles.header, wrapStyle]}>
      <TouchableOpacity onPress={() => leftClick()}>
        <View style={[styles.left, leftStyle]}>
          <Icon name={leftName ? leftName : 'left'} size={setText(48)} color="#fff" />
        </View>
      </TouchableOpacity>
      <View style={styles.titleBox}>
        <Text style={styles.title}>{leftTitle}</Text>
        <Text style={styles.title}>{rightTitle}</Text>
      </View>

      {
        rightFlag ?
        <TouchableOpacity onPress={() => rightClick(confirmDisable)}>
          <View style={[styles.right, rightStyle]}>
            <Icon size={setText(48)} name={rightName ? rightName : 'right'} color={confirmDisable ? '#aaa' : '#fff'} />
          </View>
        </TouchableOpacity>: 
        <TouchableOpacity onPress={() => rightSublim()}>
            <View style={[styles.rightBtn, rightStyle]}><Text style={styles.rightBtnTitle}>{rightBtnName}</Text></View>
        </TouchableOpacity>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    ...Styles.rowCenter,
    height: setHeight(120),
  },
  left: {
    ...Styles.rowCenter,
    width: setWidth(76),
    height: '100%',
    marginLeft: setWidth(20),
    marginRight: setWidth(20),
  },
  titleBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: setText(42),
  },
  right: {
    ...Styles.rowCenter,
    width: setWidth(76),
    height: '100%',
    marginLeft: setWidth(20),
    marginRight: setWidth(20)
  },
  rightBtn: {
    ...Styles.rowCenter,
    width: setWidth(280),
    height: setHeight(80),
    backgroundColor: '#ffffff',
    borderRadius: setWidth(10),
    marginRight: setWidth(40)
  },
  rightBtnTitle:{
    color: '#0080dc',
    fontSize: setText(42)
  }
})


export default Header