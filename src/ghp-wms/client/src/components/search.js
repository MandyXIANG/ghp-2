import React, {Component} from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Button,
  View,
} from 'react-native';
import PropTypes from 'prop-types';

import * as Constant from '~/config/constants';
import {setHeight, setWidth, setText} from '~/utils/initSize.util';
class Search extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    btnText: PropTypes.string,
    placeholder: PropTypes.string,
    btnPress: PropTypes.func,
    onChange: PropTypes.func,
  };
  constructor(props) {
    super(props);
    this.state = {searchText: ''};
  }

  onChangeText(text) {
    this.setState({
      searchText: text,
    });
    const {onChange} = this.props;
    if (onChange) {
      onChange(text);
    }
  }
  onBtnPress() {
    let {searchText} = this.state;
    const {btnPress} = this.props;
    if (btnPress) {
      btnPress(searchText);
    }
  }
  render() {
    const {searchText} = this.state;
    const {btnText, placeholder, autoFocus} = this.props;
    return (
      <View style={styles.searchContainer}>
        <TextInput
          placeholder={placeholder || '搜索'}
          style={styles.searchBox}
          value={searchText}
          autoFocus={autoFocus}
          onChangeText={text => this.onChangeText(text)}
        />
        <TouchableOpacity onPress={() => this.onBtnPress()}>
          <Text style={styles.searchBtn}>{btnText || '搜 索'}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    height: setHeight(100),
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: setWidth(16),
  },
  searchBox: {
    borderBottomColor: '#e8e8e8',
    borderBottomWidth: 1,
    flex: 1,
    height: setHeight(100),
    fontSize: setText(Constant.defaultFont),
  },
  searchBtn: {
    width: setWidth(140),
    height: setHeight(90),
    borderColor: Constant.primaryColor,
    borderWidth: 1,
    fontSize: setText(Constant.defaultFont),
    color: Constant.primaryColor,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginLeft: setWidth(16),
    borderRadius: setWidth(40),
  },
});
export default Search;
