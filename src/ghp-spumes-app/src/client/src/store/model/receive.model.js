import Http from '~/utils/http';
import axios from 'axios'

export default {
  namespace: 'receive',

  /**
   *  Initial state
   */
  state: {},

  /**
   * Reducers
   */
  reducers: {},

  /**
   * Effects/Actions
   */
  effects: dispatch => ({
    // 获取收料列表
    getReceiveList (payload) {
      return new Promise((resolve, reject) => {
        Http.post('/receive/getReceiveList', { workcenter_id: payload.workcenter_id, process_code_list: payload.process_code_list,
          pageSize:payload.pageSize, pageNo: payload.pageNo }).then(res => {
          if(res.code ===200){
            resolve(res)
          }else{
            reject(res)
          }
        }).catch(res => {
          reject(res)
        })
      })
    },
    // 获取收料详情列表
    getReceiveDetail (payload) {
      return new Promise((resolve, reject) => {
        Http.post('/receive/getReceiveDetailByProcessId', { process_id:  payload.id, pageSize:payload.pageSize, pageNo: payload.pageNo}).then(res => {
         if(res.code === 200){
           resolve(res)
         }else{
           reject(res)
         }
        }).catch(res => {
          reject(res)
        })
      })
    },
    // 更新收料详情列表
    updateReceive (payload) {
      return new Promise((resolve, reject) => {
        Http.post('/receive/updateReceive', { ids: payload.ids }).then(res => {
          resolve(res)
        }).catch(res => {
          reject(res)
        })
      })
    }
  })
}
