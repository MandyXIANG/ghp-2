import Http from '~/utils/http';

const API_MAP = {
  POST_WORKlINE: '/workcenter/getLineData',
  POST_WORKCENTER: '/workcenter/getWorkcenterData'
}

export default {
  namespace: 'workcenter',

  /**
   *  Initial state
   */
  state: {
    selectedWorkshop: {},
    workcenterList: []
  },

  /**
   * Reducers
   */
  reducers: {
    setSelectedWorkshop (state, data) {
      return {
        ...state,
        selectedWorkshop: data
      }
    },
    setWorkcenter (state, data) {
      return {
        ...state,
        workcenterList: data
      }
    }
  },

  /**
   * Effects/Actions
   */
  effects: dispatch => ({
    // 获取产线信息
    getWorkshop (payload) {
      return new Promise((resolve, reject) => {
        Http.post(API_MAP.POST_WORKlINE).then(res => {
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
    getWorkcenter (payload) {
      return new Promise((resolve, reject) => {
        Http.post(API_MAP.POST_WORKCENTER, payload).then(res => {
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
  }),
};
