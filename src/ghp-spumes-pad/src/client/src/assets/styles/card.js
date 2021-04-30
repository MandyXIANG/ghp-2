import { StyleSheet } from 'react-native';
import { setHeight, setWidth, setText } from '~/utils/initSize.util'

export default StyleSheet.create({
    cardItem: {
      width: setWidth(640),
      height: setHeight(320),
      marginHorizontal: setWidth(40),
      marginBottom: setHeight(25),
      },
      bgImg: {
        flex: 1,
        width: '100%',
        resizeMode: "cover",
        justifyContent: 'center', 
      },
      cardTop: {
        paddingHorizontal: setWidth(40),
        flexDirection: 'row',
      },
      topLeft: {
        width: setWidth(420),
        paddingVertical: setHeight(10),
      },
      firstLine: {
        marginBottom: setHeight(10),
      },
      formTitle: {
        fontSize: setText(28),
        color: '#b3b3b3'
      },
      formDesc: {
        fontSize: setText(40),
        color: '#0080DC'
      },
      input_qty: {
        fontSize: setText(40),
        color: '#333333'
      },
      output_qty: {
        fontSize: setText(47),
        color: '#0080DC'
      },
      statusImg: {
        width: setWidth(98),
        height: setHeight(178)
      },
      topRight: {
        marginLeft: setWidth(20)
      },
      cardBtm: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: setWidth(40),
        justifyContent: 'space-around',
      },
      bottomItem: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      firstBottomValue: {
        fontSize: setText(32),
        color: '#333333'
      },
      productValue: {
        width: setWidth(54),
        height: setHeight(54),
        lineHeight: setHeight(54),
        textAlign: 'center',
        color: '#fff', 
        borderRadius: 5
      },
      empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      noData: {
        width: setWidth(330),
        height: setHeight(400),
        marginTop: setHeight(250)
      }
 
})