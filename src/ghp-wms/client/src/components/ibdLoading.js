import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, ActivityIndicator, StyleSheet} from 'react-native';

import * as Constant from '~/config/constants';

class IbdLoading extends Component {
  static propTypes = {
    show: PropTypes.bool,
  };
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {show} = this.props;
    return (
      // eslint-disable-next-line react-native/no-inline-styles
      show && 
      <View style={styles.container}>
        <ActivityIndicator
          animating={show}
          size="large"
          color={Constant.primaryColor}
        />
      </View>
    );
  }
}

export default IbdLoading;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: 100,
  },
});
