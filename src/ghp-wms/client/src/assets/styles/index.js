import {StyleSheet} from 'react-native';
import * as Constant from '~/config/constants';

const commonStyles = StyleSheet.create({
  fullWH: {
    width: Constant.ScreenWidth,
    height: Constant.ScreenHeight,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteFull: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
  },
  pageContainer: {
    width: Constant.ScreenWidth,
    height: Constant.ScreenHeight,
    backgroundColor: '#FFF',
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 8,
    borderColor: '#777',
    borderWidth: 1,
  },
  circleRed: {
    width: 8,
    height: 8,
    borderRadius: 8,
    borderColor: '#f53d3d',
    borderWidth: 1,
    backgroundColor: '#f53d3d',
  },
});

export default commonStyles;
