export default {
  namespace: 'home',

  /**
   *  Initial state
   */
  state: {
    selectWarehouse: {},
  },

  /**
   * Reducers
   */
  reducers: {
    setWarehouse(state, data) {
      return {
        ...state,
        selectWarehouse: data,
      };
    },
  },

  /**
   * Effects/Actions
   */
  effects: dispatch => ({}),
};
