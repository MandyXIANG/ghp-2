import React from 'react';
import { Scene,Stack,Modal } from 'react-native-router-flux';

import {
  Login,
  Workcenter,
  Configguration,
  Post,
  Person,
  Input,
  JobInformation
} from '../pages';

const Index = (
  <Modal hideNavBar>
    <Stack hideNavBar>
      <Scene key='login' component={Login} />
      <Scene key="person" component={Person} />
      <Scene key="workcenter" component={Workcenter} />
      <Scene key='configguration' component={Configguration} />
      <Scene key='post' component={Post} />
      <Scene key='input' component={Input}></Scene>
      <Scene key='jobinformation' component={JobInformation}></Scene>
    </Stack>
  </Modal>
);




export default Index;
