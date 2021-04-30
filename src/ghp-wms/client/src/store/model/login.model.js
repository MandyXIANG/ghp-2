import React, {Component} from 'react';
import {ToastAndroid} from 'react-native'; //引入组件
import {Actions} from 'react-native-router-flux';
import AsyncStorage from '@react-native-community/async-storage';

import Http from '~/utils/http';

export default {
  namespace: 'login',

  /**
   *  Initial state
   */
  state: {
    userInfo: {},
    remember: false,
    username: '',
    password: '',
  },

  /**
   * Reducers
   */
  reducers: {
    saveLoginInfo(state, payload) {
      AsyncStorage.setItem('userInfo', JSON.stringify(payload));
      return {
        ...state,
        userInfo: payload,
      };
    },
    remember(state, data) {
      AsyncStorage.setItem('rememberInfo', JSON.stringify(data));
      return {
        ...state,
        remember: data.remember,
        username: data.username,
        password: data.password,
      };
    },
  },

  /**
   * Effects/Actions
   */
  effects: dispatch => ({
    doLogin(payload) {
      return new Promise((resolve, reject) => {
        const response = Http.post('/system/auth', {
          username: payload.username,
          password: payload.password,
        }).then(res => {
          const resData = res.data;
          if (res.result) {
            ToastAndroid.showWithGravity(
              '登录成功',
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );

            dispatch.login.saveLoginInfo(resData);
            // dispatch.login.remember(payload.remember);
            Actions.push('home');
          } else {
            reject(res);
            ToastAndroid.showWithGravity(
              resData,
              ToastAndroid.SHORT,
              ToastAndroid.TOP,
            );
          }
        });
      });
    },
  }),
};
