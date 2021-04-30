//设备的像素密度，例如：
// PixelRatio.get() === 1          mdpi Android 设备(160 dpi)
// PixelRatio.get() === 1.5        hdpi Android 设备(240 dpi)
// PixelRatio.get() === 2          iPhone 4, 4S, iPhone 5, 5c, 5s, iPhone 6, xhdpi Android 设备(320 dpi)
// PixelRatio.get() === 3          iPhone 6 plus, xxhdpi Android 设备(480 dpi)
// PixelRatio.get() === 3.5        Nexus 6 * /

import {
  Dimensions,
  PixelRatio,
} from 'react-native';


export const deviceWidth = Dimensions.get('window').width;      //设备的宽度
export const deviceHeight = Dimensions.get('window').height;    //设备的高度
let screenW = Dimensions.get('window').width;
let screenH = Dimensions.get('window').height;
let fontScale = PixelRatio.getFontScale();
let pixelRatio = PixelRatio.get();
// 高保真的宽度和告诉
const designWidth = 720;
const designHeight = 1280;

// 根据dp获取屏幕的px
let screenPxW = PixelRatio.getPixelSizeForLayoutSize(screenW);
let screenPxH = PixelRatio.getPixelSizeForLayoutSize(screenH);

/**
 * 设置text
 * @param size  px
 * @returns {Number} dp
 */
export function setText(size) {
  var scaleWidth = screenW / designWidth;
  var scaleHeight = screenH / designHeight;
  var scale = Math.min(scaleWidth, scaleHeight);
  size = Math.round(size * scale / fontScale + 0.5);
  return size;
}

/**
 * 设置高度
 * @param size  px
 * @returns {Number} dp
 */
export function setHeight(size) {
  var scaleHeight = size * screenPxH / designHeight;
  size = Math.round((scaleHeight / pixelRatio + 0.5));
  return size;
}

/**
 * 设置宽度
 * @param size  px
 * @returns {Number} dp
 */
export function setWidth(size) {
  var scaleWidth = size * screenPxW / designWidth;
  size = Math.round((scaleWidth / pixelRatio + 0.5));
  return size;
}


/**
 * 防抖
 */

 export function debounce(fn,time){
  var timeout = null;    
    return function() {        
        if(timeout !== null)   clearTimeout(timeout);        
        timeout = setTimeout(fn, time);    
    }
 }
