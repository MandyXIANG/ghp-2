import React, { Component } from 'react';
import { ToastAndroid } from 'react-native';//引入组件
import {Actions} from 'react-native-router-flux'
import AsyncStorage from '@react-native-community/async-storage';

import Http from '~/utils/http';

export default {
    namespace: 'login',

    /**
     *  Initial state
     */
    state: {
        userInfo: {},
        userData:{},
    },

    /**
     * Reducers
     */
    reducers: {
        saveLoginInfo(state, payload) {
            return {
                ...state,
                userInfo: payload,
            };
        },
        remember(state, data) {
            return {
                ...state,
                userData:data
            }
        },
    },

    /**
     * Effects/Actions
     */
    effects: dispatch => ({
        doLogin(payload) {
            return new Promise((resolve, reject) => {
                const response = Http.post('/system/auth', {
                    username: payload.username, password: payload.password
                }).then(res => {
                    const resData = res.data
                    if (res.result) {
                        ToastAndroid.showWithGravity("登录成功", ToastAndroid.SHORT, ToastAndroid.TOP)
                        Actions.push('workcenter')
                        resData.rememberConfig = payload.rememberConfig 
                        resData.password = payload.password
                        AsyncStorage.setItem('userData', JSON.stringify(resData))  //储存用户数据
                        dispatch.login.saveLoginInfo(resData)
                    } else {
                        res.code === 200 ? 
                        ToastAndroid.showWithGravity(resData, ToastAndroid.SHORT, ToastAndroid.TOP):
                        ToastAndroid.showWithGravity("网络错误", ToastAndroid.SHORT, ToastAndroid.TOP)
                    }
                })
            })
        }
    }),
};