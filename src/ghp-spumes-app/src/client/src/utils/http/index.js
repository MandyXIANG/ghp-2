import config from '../../config/config';
import * as netCode from './networkCode';
import AsyncStorage from '@react-native-community/async-storage';

export const CONTENT_TYPE_JSON = "application/json";
export const CONTENT_TYPE_FORM = "application/x-www-form-urlencoded";


class Http {

  optionParams = {
    token: '',
    timeoutMs: 30000 //默认超时未30秒
  }

  /**
   * get请求
   * @param {*} api 
   * @param {*} param 
   * @param {options = { header:Object, json:boolean, text:string, apiName:string, timeoutMs:number,responseOutData:boolean}}  options 
   */
  get(api, param = {}, options = {}) {
    return this.request(api, 'GET', param, options.header, options.json, options.text, options.apiName, options.responseOutData, options.timeoutMs);
  }

  /**
   * post请求
   * @param {*} api 
   * @param {*} body 
   * @param {options = { header:Object, json:boolean, text:string, apiName:string, timeoutMs:number,responseOutData:boolean}}  options 
   */
  post(api, body = {}, options = { json: true }) {
    return this.request(api, 'POST', body, options.header, options.json, options.text, options.apiName, options.responseOutData, options.timeoutMs);
  }


  /**
   * put请求
   * @param {*} api 
   * @param {*} body 
   * @param {options = { header:Object, json:boolean, text:string, apiName:string, timeoutMs:number,responseOutData:boolean}}  options 
   */
  put(api, body = {}, options = { json: true }) {
    return this.request(api, 'POST', body, options.header, options.json, options.text, options.apiName, options.responseOutData, options.timeoutMs);
  }

  /**
   * delete请求
   * @param {*} api 
   * @param {*} param 
   * @param {options = { header:Object, json:boolean, text:string, apiName:string, timeoutMs:number,responseOutData:boolean}}  options 
   */
  delete(api, param = {}, options = {}) {
    return this.request(api, 'POST', param, options.header, options.json, options.text, options.apiName, options.responseOutData, options.timeoutMs);
  }

  /**
   * head请求
   * @param {*} api 
   * @param {*} param 
   * @param {options = { header:Object, json:boolean, text:string, apiName:string, timeoutMs:number,responseOutData:boolean}}  options 
   */
  head(api, param = {}, options = {}) {
    return this.request(api, 'POST', param, options.header, options.json, options.text, options.apiName, options.responseOutData, options.timeoutMs);

  }


  async request(url, method = 'GET', params, header, json, text, apiName, responseOutData, ms) {
    return new Promise(async (resolve, reject) => {

      if (!this.optionParams.token) {
        let token = this.getAuthorization();
      }
      let headers = { connection: 'close' };
      if (this.optionParams.token) headers.Authorization = this.optionParams.token;
      if (header) {
        headers = Object.assign({}, headers, header)
      }
      let requestParams;

      if (method !== 'GET') {
        if (json) {
          requestParams = this.formParamsJson(method, params, headers)
        } else {
          requestParams = this.formParams(method, params, headers)
        }
      } else {
        requestParams = this.formParams(method, params, headers);
        url = url + '?' + requestParams.body;
        delete requestParams.body;
      }

      let storageUrl = await AsyncStorage.getItem('server_url');

      if (apiName && config[apiName]) {
        url = config[apiName] + url;
      } else {
        if (storageUrl) {
          url = storageUrl + url;
        } else {
          url = config.baseUrl + url;
        }
      }
      let response = await this.requestWithTimeout(ms || this.optionParams.timeoutMs, fetch(url, requestParams), text);
      if (__DEV__) { //开发模式下打印这些参数
        console.log('请求url: ', url);
        console.log('请求参数: ', requestParams);
        console.log('返回参数: ', response);
      }



      if (response && response.status === netCode.NETWORK_TIMEOUT) {
        resolve({
          result: false,
          code: response.status,
          data: netCode.default(response.status, response.statusText),
        })
      }

      try {
        if (text) {
          resolve({
            data: response,
            result: true,
            code: netCode.SUCCESS
          })
        } else {
          let responseJson = await response.json();
          //请求成功没有data默认是属于错误的那种，responseOutData可以告诉该接口，返回结果在data外面
          if (response.status === 200 || response.status === 201) {
            if (responseOutData) { //返回结果在data外面
              resolve({
                result: true,
                code: netCode.SUCCESS,
                data: responseJson,
                headers: response.headers
              })
            } else {
              if (responseJson.data != undefined) {
                resolve({
                  result: true,
                  code: netCode.SUCCESS,
                  data: responseJson.data,
                  headers: response.headers
                })
              } else {
                resolve({
                  result: false,
                  code: netCode.SUCCESS,
                  data: responseJson.errText || responseJson,
                  headers: response.headers
                })
              }
            }
          } else {
            resolve({
              result: false,
              code: netCode.FAILED,
              data: responseJson.errText || responseJson,
              headers: response.headers
            })
          }
        }
      } catch (e) {
        resolve({
          data: response._bodyText,
          result: false,
          code: response.status ? response.status : netCode.NETWORK_JSON_EXCEPTION,
          response
        })
      }
    })
  }

  /**
   * 格式化json请求参数
   * @param {*} method 
   * @param {*} params 
   * @param {*} headers 
   */
  formParamsJson(method, params, headers) {
    const body = JSON.stringify(params);
    const req = {
      method: method,
      headers: new Headers({
        'Content-Type': CONTENT_TYPE_JSON,
        ...(headers || {})
      }),
      body
    };
    return req
  }

  /**
   * 格式化form表单请求参数
   * @param {*} method 
   * @param {*} params 
   * @param {*} headers 
   */
  formParams(method, params, headers) {
    const str = [];
    for (let p in params) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
    }
    let body = null;
    if (str.length > 0) {
      body = str.join("&");
    }
    const req = {
      method: method,
      headers: new Headers({
        'Content-Type': CONTENT_TYPE_FORM,
        ...(headers || {})
      }
      ),
      body
    };
    return req
  }


  /**
   * 获取token
   */
  getAuthorization() {
    // let token = await AsyncStorage.getItem('token');
    this.optionParams.token = 'token';
    return 'token';
  }

  /**
   * 超时管理
   * @param {*} ms 毫秒
   * @param {*} promise 
   * @param {*} text 
   */
  requestWithTimeout(ms, promise, text) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        resolve({
          code: netCode.NETWORK_TIMEOUT,
          data: '网络连接超时'
        })
      }, ms);
      promise

        .then(res => {
          clearTimeout(timeoutId);
          if (text) {
            resolve(res.text());
          } else {
            resolve(res);
          }
        }
        ).catch(
          (err) => {
            clearTimeout(timeoutId);
            resolve(err);
          });
    })
  }

}


export default new Http();