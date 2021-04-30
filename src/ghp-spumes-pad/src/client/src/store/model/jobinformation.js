import Http from '~/utils/http';

export default {
  namespace: 'jobinformation',
  /**
  *  Initial state
  */
  state: {
    partnumber: '请选择物料编码',
    tabName: 'production'
  },
  /**
 * Reducers
 */
  reducers: {
    setTabName (state, data) {
      return {
        ...state,
        tabName: data
      }
    },
    setPartnumber(state,data){
      return {
        ...state,
        partnumber:data
      }
    }
  },
  /**
  * Effects/Actions
  */
  effects: dispatch => ({
    /**获取物料号 */
    getPartnumberData: (playload) => {
      return new Promise((resolve, reject) => {
        const response = Http.post('/batch-selection/getPartnumberData', playload).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        }, err => {
          reject(err)
        })
      })
    },
    /**通过物料号获取生产批次或审核确认数据 */
    getListData: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post('/batch-selection/getListData', playload).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        })
      }, err => {
        reject(err)
      })
    },
    /**通过小批号和工作中心获取开工(报工)的全部数据 */
    getProcessData: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post('/batch-selection/getProcessData', playload).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        }, err => {
          reject(err)
        })
      })
    },
    /**批量开工 */
    getStartProcess: (playload) => {
      return new Promise((resove, reject) => {
        Http.post('/client/ghp-start_process', playload).then(res => {
          if (res.code === 200) {
            resove(res)
          } else {
            reject(res)
          }
        }, err => {
          reject(err)
        })
      })
    },
    // 批量报工
    getFinishProcess: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post('/client/ghp-finish_process', playload).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        }, err => [
          reject(err)
        ])
      })
    },

    /**报工check */
    checkData: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post("/batch-selection/checkData", playload).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        }, err => {
          reject(err)
        })
      })
    },

    /**获取报工的完工时间和总报废数量 */
    getEndTimeAndScrapQty: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post('/batch-selection/getEndTimeAndScrapQty', playload).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        }, err => {
          reject(err)
        })
      })
    },
    //审核确认
    confirmInspection: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post("/batch-selection/confirmInspection", playload).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        }, err => {
          reject(err)
        })
      })
    }
  })
}