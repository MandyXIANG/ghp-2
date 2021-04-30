import React from 'react';
import { Scene, Tabs, Stack, Modal, Router } from 'react-native-router-flux';

import {
  Login,
  Workcenter,
  Configguration,
  Post,
  ProductionTask,
  JobInformation,
  Person,
  Receive,
  ReceiveInfo
} from '../pages';

const Index = (
  <Modal hideNavBar>
    <Stack hideNavBar>
      <Scene key='login' component={Login} />
      <Scene key="person" component={Person} />
      <Scene key="workcenter" component={Workcenter} />
      <Scene key='configguration' component={Configguration} />
      <Scene key='post' component={Post} />
      <Scene key='productiontask' component={ProductionTask} />
      <Scene key='jobinformation' component={JobInformation} />
      <Scene key='receive' component={Receive} />
      <Scene key='receiveinfo' component={ReceiveInfo} />
    </Stack>
  </Modal>
);




export default Index;
