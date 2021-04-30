import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Container,
} from 'native-base';
import { StyleSheet, View, FlatList, Image, ToastAndroid, Text, DeviceEventEmitter } from 'react-native';
import Header from '../../components/Header';
import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import { Actions } from 'react-native-router-flux';
import LinearGradient from 'react-native-linear-gradient'
class Post extends Component {

  constructor(props) {
    super(props);
    this.state = {
      onlinePerson: [],
      modifyTime: '',
      workshift: '',
      refreshing: false
    }
  }
  componentDidMount () {
    this.initData()
    DeviceEventEmitter.addListener("post", () => {
      this.initData()
    })
  }
  render () {
    const { onlinePerson, workshift, refreshing } = this.state
    const { workItem } = this.props
    return (
      <Container>
        <LinearGradient colors={["#00bdf7", '#00b3f2']} >
          <Header rightFlag={true} leftTitle={workItem.name} rightTitle={'下一步'}
            leftClick={() => this.back()} rightClick={() => this.goTo()}></Header>
          <Text style={styles.teamTitle}>{workshift}</Text>
        </LinearGradient>
        <LinearGradient colors={["#00b1f1", '#0084de']} style={styles.post}>
          <FlatList
            refreshing={refreshing}
            data={onlinePerson}
            keyExtractor={(item) => item.post}
            renderItem={({ item }) => this.renderItem(item)}
            onRefresh={() => this.refresh()}
            ListEmptyComponent={() => this.renderEmpty()}
          >
          </FlatList>
        </LinearGradient>
      </Container>
    )

  }

  /**有数据的渲染 */
  renderItem (item) {
    return (
      <View>
        <Text style={styles.postTitle}>{item.post}</Text>
        {
          item.detail.map((list, index) => {
            return (
              <View style={styles.postList} key={index}>
                <View style={styles.postInfo}>
                  <Image source={require('../../assets/images/user.png')} style={styles.postImage}></Image>
                  <Text style={styles.postUser}>{list.name}</Text>
                </View>
                {
                  list.authorizer ? <Text style={styles.postAuthorization}>({list.authorizer}授权)</Text> : null
                }
              </View>
            )
          })
        }
      </View>

    )
  }

  /**没有数据的渲染 */
  renderEmpty () {
    return (
      <View style={styles.empty}>
        <Image source={require('../../assets/images/noteam.png')} style={styles.noData}></Image>
      </View>
    )
  }
  /**下拉刷新 */
  refresh () {
    this.initData()
  }
  back = () => {
    DeviceEventEmitter.emit('workcenter');
    Actions.pop()
  }
  goTo = () => {
    const { onlinePerson, modifyTime, workshift } = this.state
    const { checkoutOnlinePerson, workItem } = this.props
    if (onlinePerson.length) {
      //验证checkoutOnlinePerson
      checkoutOnlinePerson({ workcenter_id: workItem.id }).then(res => {
        if (res.data === modifyTime) {
          Actions.productiontask({ workItem: workItem, workshift: workshift })
        } else {
          ToastAndroid.showWithGravity("在岗人员有变动,请重新加载!", ToastAndroid.SHORT, ToastAndroid.TOP)
        }
      })
    } else {
      ToastAndroid.showWithGravity("此工位未锁定上岗人员,请先锁定上岗!", ToastAndroid.SHORT, ToastAndroid.TOP)
    }
  }
  initData = () => {
    const { getOnlinePerson, workItem } = this.props
    this.setState({
      onlinePerson: [],
      modifyTime: '',
      workshift: '',
      refreshing: true
    }, () => {
      getOnlinePerson({ workcenter_id: workItem.id }).then(res => {
        if (res.data && res.data.online_person.length) {
          this.setState({
            onlinePerson: res.data.online_person,
            modifyTime: res.data.modify_time,
            workshift: res.data.workshift,
            refreshing: false
          })
        } else {
          this.setState({
            refreshing: false
          })
          ToastAndroid.showWithGravity("此工位未锁定上岗人员,请先锁定上岗!", ToastAndroid.SHORT, ToastAndroid.TOP)
        }
      }, err => {
        this.setState({
          refreshing: false
        })
        ToastAndroid.showWithGravity(err.data, ToastAndroid.SHORT, ToastAndroid.TOP)
      })
    })
  }
}


const mapStateToProps = (state) => ({

});

const mapDispatchToProps = (dispatch) => ({
  getOnlinePerson: dispatch.post.getOnlinePerson,
  checkoutOnlinePerson: dispatch.post.checkoutOnlinePerson
});

const styles = StyleSheet.create({
  teamTitle: {
    marginTop: setHeight(20),
    marginBottom: setHeight(30),
    marginHorizontal: setWidth(40),
    height: setHeight(86),
    backgroundColor: '#fff',
    borderRadius: 5,
    color: '#333',
    fontSize: setText(36),
    textAlign: "center",
    textAlignVertical: "center",
  },
  post: {
    flex: 1,
    paddingHorizontal: setWidth(40),
    height: '100%'
  },
  postTitle: {
    color: '#fff',
    fontSize: setText(40),
    paddingVertical: setHeight(30)
  },
  postList: {
    height: setHeight(118),
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: setHeight(20),
    display: "flex",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postInfo: {
    display: 'flex',
    flexDirection: 'row',
  },
  postImage: {
    width: setWidth(72),
    height: setWidth(72),
    marginLeft: setWidth(40),
    marginRight: setWidth(20)
  },
  postUser: {
    textAlign: 'center',
    textAlignVertical: "center",
    fontSize: setText(36),
    color: '#333'
  },
  postAuthorization: {
    marginRight: setWidth(40),
    color: '#54d6b7',
    fontSize: setText(36)
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
  },
  noData: {
    width: setWidth(356),
    height: setHeight(520),
    marginTop: setHeight(200)
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Post);