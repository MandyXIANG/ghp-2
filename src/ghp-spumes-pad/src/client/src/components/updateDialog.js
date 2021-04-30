import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text, Image, Platform, ProgressViewIOS, View, StyleSheet, ProgressBarAndroid, ImageBackground } from 'react-native';
// import RootSiblings from 'react-native-root-siblings';
import { setHeight, setWidth, setText } from '~/utils/initSize.util';


class UpdateDialog extends Component {
  static propTypes = {
    current: PropTypes.number,
    total: PropTypes.number,
    title: PropTypes.string,
    describe: PropTypes.string,
    topBg: PropTypes.string,
    titleColor: PropTypes.string,
    desColor: PropTypes.string,
    progressColor: PropTypes.string,

  };
  static defaultProps = {
    title: '努力下载中...',
    describe: '请耐心等待',
    titleColor: '#fff',
    topBg: "#2196F3",
    desColor: '#fff',
    progressColor: '#2196F3',
    current: 0,
    total: 100
  }
  constructor(props) {
    super(props);
    this.state = {
      data: 0
    }
  }

  componentDidMount() {

  }
  render() {
    let { title, describe, titleColor, desColor, topBg, current, total } = this.props;
    return (
      <View style={style.container}>

        <View style={style.alertBox}>
          <View style={[style.topArea, { backgroundColor: topBg }]}>
            <Text style={[style.title, { color: titleColor }]}>{title}</Text>
            <Text style={[style.desc, { color: desColor }]}>{describe}</Text>
          </View>
          <View style={style.btmArea}>
            {
              Platform.OS == 'ios' && <ProgressViewIOS progress={current / (total || 100)} />
            }
            {
              Platform.OS == 'android' && <ProgressBarAndroid
                styleAttr="Horizontal"
                indeterminate={false}
                progress={current / (total || 100)}
              />
            }
            <Text style={style.text}>
              {parseInt(current / total * 100)}%
            </Text>
          </View>

        </View>
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100
  },
  alertBox: {
    width: setWidth(350),
    height: setHeight(250),
    overflow: 'hidden',
    borderColor: '#666',
    borderWidth: 1,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -setWidth(150) }, { translateY: -setHeight(100) }],
    backgroundColor: '#FFF',
    borderRadius: 10

  },
  topArea: {
    width: '100%',
    height: setHeight(130),
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: setWidth(10)
  },
  title: {
    color: "#fff",
    fontSize: setText(20),
    textAlign: "center"

  },
  desc: {
    color: "#fff",
    textAlign: "center",
    marginTop: setHeight(20)

  },
  btmArea: {
    padding: setHeight(20)
  },
  text: {
    textAlign: 'center',
    marginTop: setHeight(15)
  }

})



export default UpdateDialog;