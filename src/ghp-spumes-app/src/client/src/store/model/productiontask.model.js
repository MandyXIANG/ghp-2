import Http from '~/utils/http';
import axios from 'axios'

export default {
  namespace: 'productiontask',

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
    getProductData (payload) {
      return new Promise((resolve, reject) => {
        Http.post('/production-task/getProductionTaskData', { process_code_list: payload.process_code_list, workcenter_id: payload.workcenter_id,
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
    }
  })
};
