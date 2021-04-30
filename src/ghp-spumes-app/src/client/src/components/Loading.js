import React from 'react';
import {View, ActivityIndicator} from 'react-native';

const Loading = () => (
  // eslint-disable-next-line react-native/no-inline-styles
  <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center'}}>
    <ActivityIndicator size="large" />
  </View>
);

export default Loading;
