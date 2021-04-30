import {AppRegistry, YellowBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

YellowBox.ignoreWarnings([
  'Warning: componentWillMount is deprecated',
  'Warning: componentWillReceiveProps is deprecated',
  'Module RCTImageLoader requires',
  'Warning: componentWillUpdate is deprecated',
]);

AppRegistry.registerComponent(appName, () => App);
