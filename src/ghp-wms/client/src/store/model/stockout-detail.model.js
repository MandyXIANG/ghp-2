import Http from '~/utils/http';
export default {
  namespace: 'stockoutDetail',

  /**
   *  Initial state
   */
  state: {

  },

  /**
   * Reducers
   */
  reducers: {

  },

  /**
   * Effects/Actions
   */
  effects: dispatch => ({
    /**获取详情列表 */
    getStockoutDetailById: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post("/stockout/getStockoutDetailById", playload).then(res => {
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
    /**关闭单据 */
    closeReceipt: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post("/stockout/closeReceipt", playload).then(res => {
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
    /**保存 */
    saveStockout: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post("/stockout/saveStockout", playload).then(res => {
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
  }),
};
