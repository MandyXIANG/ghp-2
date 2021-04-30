import { Actions } from "react-native-router-flux";
import { ToastAndroid } from 'react-native';
//网络错误
export const NETWORK_ERROR = 1;
//网络超时
export const NETWORK_TIMEOUT = 2;
//网络返回数据格式化一次
export const NETWORK_JSON_EXCEPTION = 3;

export const FAILED = 400;

export const SUCCESS = 200;


export default function (code, statusText) {
    switch (code) {
        case 401:
            //授权逻辑 没有登录跳转登录
            if (Actions.currentScene !== 'loginPage') {
                Actions.reset("loginPage");
            }
            return "未授权或授权失败";//401 Unauthorized
        case 403:
            IbdToast('禁止访问');
            return "403权限错误";
        case 404:
            IbdToast('找不到资源');
            return "404错误";
        case 410:
            IbdToast('410错误');
            return "410错误";
        case NETWORK_TIMEOUT:
            //超时
            IbdToast('网络超时');
            return '网络错误';
        default:
            if (statusText) {
                ToastAndroid.showWithGravity(statusText,ToastAndroid.SHORT,ToastAndroid.TOP)
            } else {
                IbdToast('未知错误');
            }
            return "未知错误"
    }

}