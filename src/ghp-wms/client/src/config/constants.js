import React, {Dimensions, StatusBar} from 'react-native';

export const ScreenWidth = Dimensions.get('window').width;

export const ScreenHeight = Dimensions.get('window').height;

export const statusBarHeight = StatusBar.currentHeight; // 状态栏高度

export const tabbarHeight = 64;

export const lgFont = 46; // 标题文字

export const mdFont = 40;  // 中等大小文字

export const defaultFont = 36; // 正文文字

export const primaryColor = 'rgb(51,173,240)'; // 主题色


export const grayColor = '#999'; // 灰色

export const borderColor = '#e8e8e8'; //线的默认颜色