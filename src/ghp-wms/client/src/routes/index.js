import React from 'react';
import {Scene, Stack, Modal} from 'react-native-router-flux';

import {Login, Home, Stockin, Stockout, Mine, StockinDetail,StockoutDetail} from '../pages';

const Index = (
  <Modal hideNavBar>
    <Stack hideNavBar>
      <Scene key="login" component={Login} />
      <Scene key="home" component={Home} />
      <Scene key="stockin" component={Stockin} />
      <Scene key="stockout" component={Stockout} />
      <Scene key="mine" component={Mine} />
      <Scene key="stockinDetail" component={StockinDetail} />
      <Scene key="stockoutDetail" component={StockoutDetail} />
    </Stack>
  </Modal>
);

export default Index;
