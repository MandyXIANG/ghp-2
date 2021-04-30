import { setHeight, setWidth, setText } from '~/utils/initSize.util'

export default {
    row:{
        flexDirection:'row',
        alignItems: 'center',
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    columnCenter: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    columnBetween: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    redCircle:{
        width:setWidth(10),
        height:setWidth(10),
        borderRadius: 50,
        backgroundColor:'#f15a24'
    },
    blue:{
        backgroundColor:'#0080dc'
    },
    fullCenter:{
        width:'100%',
        height:'100%',
        alignItems: 'center',
        justifyContent:'center'
    }
}