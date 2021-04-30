import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router, Stack } from 'react-native-router-flux';
import { PersistGate } from 'redux-persist/es/integration/react';
import SplashScreen from 'react-native-splash-screen';
import { connect } from 'react-redux'

import { Root } from 'native-base';

import Routes from './routes';
import Loading from '~/components/Loading';


class App extends React.Component {
  constructor() {
    super();
    this.state = { loading: true };
  }

  async componentDidMount() {
    SplashScreen.hide();
    this.setState({ loading: false })
  }

  render() {
    const { loading } = this.state;
    const { store, persistor } = this.props;

    if (loading) {
      return <Loading />;
    }

    return (
      <Root>
        <Provider store={store}>
          <PersistGate loading={<Loading />} persistor={persistor}>
            <Router>
              {Routes}
            </Router>
          </PersistGate>
        </Provider>
      </Root>
    );
  }
}

App.propTypes = {
  store: PropTypes.shape({}).isRequired,
  persistor: PropTypes.shape({}).isRequired,
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = (dispatch) => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
