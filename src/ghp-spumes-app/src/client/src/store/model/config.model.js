import Http from '~/utils/http';
import axios from 'axios'

export default {
  namespace: 'config',

  /**
   *  Initial state
   */
  state: {
    http_url: "",
  },

  /**
   * Reducers
   */
  reducers: {
    setConfig(state, payload) {
      return {
        ...state,
        http_url: payload.http_url
      };
    }
  },

  /**
   * Effects/Actions
   */
  effects: dispatch => ({
    testLink(payload) {
      return new Promise((resolve, reject) => {
        console.log(payload.http_url, 'http_urlanna')
        axios.get(`${payload.http_url}/system/getDatabaseConfig`).then(res => {
          console.log(res,'resresresresres')
          resolve(res)
        }).catch(err => {
          console.log(err,'errr')
          reject(err)
        })
      })
    }
  }),
};
