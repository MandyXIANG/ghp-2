import Http from '~/utils/http';

const API_MAP = {
  POST_BADLIST: '/input/getParamsData', // 获取不良项
  POST_MAOPOLIST: '/input/getPartnumberLotno', // 获取物料和批次号
  POST_SUBMIT: '/input/saveInspectionData' // 提审
}

export default {
  namespace: 'input',
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
    getBadList (payload) { // 获取不良项
      return new Promise((resolve, reject) => {
        Http.post(API_MAP.POST_BADLIST, { code: payload.code }).then(res => {
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

    getMarList (payload) { // 获取物料编码和批次号
      return new Promise((resolve, reject) => {
        Http.post(API_MAP.POST_MAOPOLIST, { workcenter_id: payload.workcenter_id }).then(res => {
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

    submitData (payload) { // 提审
      return new Promise((resolve, reject) => {
        Http.post(API_MAP.POST_SUBMIT, payload ).then(res => {
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
  })
}