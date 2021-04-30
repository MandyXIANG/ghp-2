import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, TouchableOpacity,ToastAndroid } from 'react-native';
import { Container, Content, View, Text, Input, Item, Button } from 'native-base';
import Header from '~/components/Header'//引入封装的头部
import IbdToast from '~/components/IbdToast'

import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import Styles from '~/assets/styles/base'

class Config extends Component {
    constructor(props) {
        super(props);
        this.state = {
            http_url: '',
            conf_file: '',
            show: false,
            title: '',
            type: '',
            content: '',
        };
    }
    componentDidMount() {
    }
    // 返回
    back = () => {
        this.props.navigation.pop()//返回
    }
    // 确认
    affirm = () => {
        let { http_url, conf_file } = this.state
        this.props.testConfig({ http_url, conf_file }).then(res => {
            if (Object.keys(res.data.data).length === 0) {
                this.setState({
                    show: true,
                    type: 'error',
                    title: 'Failure',
                    content: '配置错误'
                })
            } else {
                this.props.setConfig({ http_url, conf_file })
                ToastAndroid.show('保存成功', ToastAndroid.SHORT);//成功提示
                this.props.navigation.navigate('status')
            }
        }).catch(err => {
            this.setState({
                show: true,
                title: 'Failure',
                type: 'error',
                content: '地址错误'
            })
        })
    }
    // 连接测试
    connectTset() {

        let { http_url, conf_file } = this.state
        this.props.testConfig({ http_url, conf_file }).then(res => {
            if (Object.keys(res.data.data).length === 0) {
                this.setState({
                    show: true,
                    type: 'error',
                    title: 'Failure',
                    content: '配置错误'
                })
            } else {
                this.setState({
                    show: true,
                    title: 'succeed',
                    type: 'success',
                    content: '链接成功'
                })
            }
        }).catch(err => {
            this.setState({
                show: true,
                title: 'Failure',
                type: 'error',
                content: '地址错误'
            })
        })

    }
    render() {
        let { type, content, title } = this.state
        return (
            <Container>
                <Header title='Config'
                    leftClick={() => { this.back() }}
                    rightClick={() => { this.affirm() }} />
                <Content style={styles.contentStyle}>
                    <View style={styles.viewStyle}>
                        <Text>更改地址</Text>
                        <Item>
                            <Input
                                placeholder='http_url'
                                onChangeText={value => this.setState({ http_url: value })} />
                        </Item>
                    </View>
                    <View style={styles.viewStyle}>
                        <Text>更改配置</Text>
                        <Item>
                            <Input
                                placeholder='conf_file'
                                onChangeText={value => this.setState({ conf_file: value })} />
                        </Item>
                    </View>
                    <TouchableOpacity>
                        <Button
                            onPress={() => this.connectTset()}
                            style={styles.buttonStyle}
                        ><Text>链接测试</Text></Button>
                    </TouchableOpacity>

                    <IbdToast show={this.state.show} title={title} content={content} type={type}
                        buttonConfig={{
                            text: 'Confirm',
                            onPress: () => {
                                this.setState({
                                    show: false
                                })
                            }
                        }} ></IbdToast>
                </Content>
            </Container>
        );
    }
}

const styles = StyleSheet.create({
    contentStyle: {
        padding: setHeight(20)
    },
    viewStyle: {
        marginBottom: setHeight(20),

    },
    buttonStyle: {
        backgroundColor: '#00bdf7',
        justifyContent: 'center'
    }
})

const mapStateToProps = (state) => ({
    http_url: state.config.http_url,
    conf_file: state.config.conf_file
});

const mapDispatchToProps = (dispatch) => ({
    setConfig: dispatch.config.setConfig,
    testConfig: dispatch.config.testConfig,

});

export default connect(mapStateToProps, mapDispatchToProps)(Config);