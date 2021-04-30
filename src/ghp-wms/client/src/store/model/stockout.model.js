import Http from '~/utils/http';
export default {
  namespace: 'stockout',

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
    getStockoutList: (playload) => {
      return new Promise((resolve, reject) => {
        Http.post("/stockout/getStockoutList", playload).then(res => {
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
