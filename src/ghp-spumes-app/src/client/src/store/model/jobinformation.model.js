import Http from '~/utils/http';
import axios from 'axios'

export default {
  namespace: 'jobinformation',

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
    /**通过生产列表获取报工列表数据 */
    getJobList: (playload) => {
      return new Promise((resove, reject) => {
        const response = Http.post('/job-information/getJobList', { id: playload.task_id }).then(res => {
          resove(res)
        }, err => {
          reject(err)
        })
      })
    },
    /**通过挂架报工(输入小批号)获取报工列表数据 */
    getStageDmcList: (playload) => {
      return new Promise((resove, reject) => {
        const response = Http.post('/job-information/getStageDmcList', { workcenter_id: playload.workcenter_id, dmc: playload.dmc }).then(res => {
          console.log(res, 'resresres')
          if(res.code===200){
            resove(res)
          }else{
            reject(res)
          }
        }, err => {
          reject(err)
        })
      })
    },
    /**check二维码 并获取数据 */
    getCheckBarcode: (playload) => {
      return new Promise((resove, reject) => {
        const response = Http.post('/client/ghp-check_barcode', { barcode: playload.barcode, workcenter_id: playload.workcenter_id }).then(res => {
          resove(res)
        }, err => {
          reject(err)
        })
      })
    },
    /**批量开工 */
    getStartProcess: (playload) => {
      return new Promise((resove, reject) => {
        const response = Http.post('/client/ghp-start_process',
          {
            workcenter_id: playload.workcenter_id,
            resume_id: playload.resume_id,
            submit_start: playload.submit_start
          }).then(res => {
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
        const response = Http.post('/client/ghp-finish_process', {
          workcenter_id: playload.workcenter_id,
          submit_end: playload.submit_end,
          wip_parts_info: playload.wip_parts_info
        }).then(res => {
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
    /**单独开工(第一道工序) */
    getSingleFirstProcessStartProcess: (playload) => {
      return new Promise((resolve, reject) => {
        const respones = Http.post('/client/ghp-start_process', {
          workcenter_id: playload.workcenter_id,
          wip_parts_info: playload.wip_parts_info,
          ishighlight: playload.ishighlight,
          rack_qty: playload.rack_qty,
          islotend: playload.islotend,
          input_qty: playload.input_qty,
          process_id: playload.process_id,
          partnumber: playload.partnumber,
          product_line: playload.product_line,
          stage1_dmc: playload.stage1_dmc,
          submit_start: playload.submit_start
        }).then(res => {
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
    /**单独开工(非第一道工序) */
    getSingleStartProcess: (playload) => {
      return new Promise((resolve, reject) => {
        const respones = Http.post('/client/ghp-start_process', {
          workcenter_id: playload.workcenter_id,//必填
          resume_id: playload.resume_id, //报工条目id；非第一工序时传此参数，根据id直接定位报工条目
          ishighlight: playload.ishighlight, //非必填
          rack_qty: playload.rack_qty,  //非必填
          islotend: playload.islotend,  //非必填
          submit_start: playload.submit_start
        }).then(res => {
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
    /**单独报工 */
    getSingleFinishProcess: (playload) => {
      return new Promise((resolve, reject) => {
        const respones = Http.post('/client/ghp-finish_process',
          {
            workcenter_id: playload.workcenter_id,
            start_time: playload.start_time,
            submit_end: playload.submit_end,
            wip_parts_info: playload.wip_parts_info
          }).then(res => {
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
    //编辑接口
    getEditSubmit: (playload) => {
      console.log(playload, '编辑接口')
      return new Promise((resolve, reject) => {
        const response = Http.post('/client/ghp-edit_submit_info', {
          seq: playload.seq,
          prod_resume_id: playload.prod_resume_id,
          start_time: playload.start_time,
          end_time: playload.end_time,
          ishighlight: playload.ishighlight,
          islotend: playload.islotend,
          input_qty: playload.input_qty,
          good_qty: playload.good_qty,
          diff_qty: playload.diff_qty,
          scrap_qty: playload.scrap_qty,
          process_id: playload.process_id,
          rack_qty: playload.rack_qty,
          remarks: playload.remarks,
          modify_person: playload.modify_person,
          modify_site: playload.modify_site
        }).then(res => {
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
    //获取开工即完工的结束时间
    getEndTime: (playload) => {
      return new Promise((resolve, reject) => {
        const respones = Http.post('/job-information/getEndTime',
          {
            prod_process_id: playload.prod_process_id
          }).then(res => {
            resolve(res)
          }, err => {
            reject(err)
          })
      })
    }
  }),
};
