import Http from '~/utils/http';

export default {
  namespace: 'post',

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
    getOnlinePerson: (playload) => {
      return new Promise((resolve, reject) => {
        const response = Http.post('/post/getOnlinePerson', {
          workcenter_id: playload.workcenter_id
        }).then(res => {
          resolve(res)
        }, err => {
          reject(err)
        })
      })
    },
    checkoutOnlinePerson: (playload) => {
      return new Promise((resolve, reject) => {
        const respone = Http.post('/post/checkoutOnlinePerson', {
          workcenter_id: playload.workcenter_id
        }).then(res => {
          resolve(res)
        }, err => {
          reject(err)
        })
      })
    }
  }),
};
