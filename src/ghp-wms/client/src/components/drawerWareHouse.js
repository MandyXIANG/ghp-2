import React, {Component} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import PropTypes from 'prop-types';

import {setHeight, setWidth, setText} from '~/utils/initSize.util';
import * as Constant from '~/config/constants';

class DrawerWareHouse extends Component {
  static propTypes = {
    data: PropTypes.array,
    onClose: PropTypes.func,
    onClick: PropTypes.func,
  };
  constructor(props) {
    super(props);
    this.state = {
      copyData: props.data || [],
    };
  }
  componentDidMount() {}
  close() {
    const {onClose} = this.props;
    if (onClose) onClose();
  }
  clickItem(item) {
    const {onClick} = this.props;
    if (onClick) {
      onClick(item);
    }
  }

  onChangeText(text) {
    let {copyData} = this.state;
    let {data} = this.props;
    if (text) {
      let filterData = copyData.filter(o => {
        return (
          o['name'].toLowerCase().indexOf(text.toLowerCase()) > -1 ||
          o['code'].toLowerCase().indexOf(text.toLowerCase()) > -1
        );
      });
      this.setState({
        copyData: filterData,
      });
    } else {
      this.setState({
        copyData: data,
      });
    }
  }

  renderItem({item}) {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          this.clickItem(item);
        }}>
        <Text style={styles.itemText}>
          {item.name}({item.code})
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const {copyData} = this.state;
    return (
      <Modal animationType="fade" transparent={true}>
        <View style={styles.drawerContainer}>
          <View style={styles.content}>
            <View style={styles.title}>
              <Text style={styles.titleText}>仓库</Text>
              <TextInput
                onChangeText={text => this.onChangeText(text)}
                placeholder="搜索"
                placeholderTextColor="#fff"
                style={styles.searchBox}
              />
            </View>
            <FlatList
              style={styles.list}
              data={copyData}
              renderItem={item => this.renderItem(item)}
              keyExtractor={item => item.id + ''}
            />
          </View>
          <TouchableOpacity
            style={styles.other}
            onPress={() => {
              this.close();
            }}
          />
        </View>
      </Modal>
    );
  }
}
const styles = StyleSheet.create({
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    flexDirection: 'row',
  },
  content: {
    width: '75%',
    height: '100%',
    backgroundColor: '#fff',
  },
  other: {
    flex: 1,
    backgroundColor: '#999',
    opacity: 0.6,
  },
  title: {
    width: '100%',
    height: setHeight(100),
    backgroundColor: Constant.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    padding: setWidth(16),
  },
  titleText: {
    color: '#fff',
    fontSize: setText(Constant.lgFont),
  },
  searchBox: {
    flex: 1,
    height: '100%',
    marginLeft: setWidth(16),
    borderBottomColor: '#fff',
    borderBottomWidth: 1,
    color: '#fff',
    fontSize: setText(Constant.defaultFont),
  },
  list: {
    paddingLeft: setHeight(16),
    paddingRight: setHeight(16),
  },
  item: {
    width: '100%',
    height: setHeight(100),
    borderBottomColor: Constant.borderColor,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: setText(Constant.defaultFont),
  },
});
export default DrawerWareHouse;
