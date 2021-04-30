import React, {Dimensions ,StatusBar} from "react-native";

export const ScreenWidth = Dimensions.get('window').width;

export const ScreenHeight = Dimensions.get('window').height;

export const statusBarHeight = StatusBar.currentHeight; // 状态栏高度

export const tabbarHeight = 64