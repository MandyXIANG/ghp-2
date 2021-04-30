import React, { Component } from 'react';
import { StyleSheet, ImageBackground, TouchableOpacity, Image, View, Text, BackHandler,ToastAndroid } from 'react-native';
import { Actions } from 'react-native-router-flux';
import { connect } from 'react-redux';
import CodePush from "react-native-code-push";
import UpdateDialog from '~/components/updateDialog'
import { setHeight, setWidth, setText } from '~/utils/initSize.util'
import versionNumber from '../../../package.json'

const imgList = {
    bgImage: require('~/assets/images/personbg.png'),
    backIcon: require('~/assets/images/back.png'),
    topTitleImg: require('~/assets/images/TopMESPerson.png'),
    companyLog: require('~/assets/images/company.png'),
    rightIcon: require('~/assets/images/user.png')
}

class Person extends Component {
    constructor(props) {
        super(props);
        this.state = {
            versionNum: versionNumber.version,
            year: (new Date).getFullYear(),
            visitDialog: false,
            current: 0,
            total: 100,
            showUpdate: false,
        }
    }
    componentDidMount () {
        this.checkUpdate();
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackHandler)
        }
    }

    componentWillUnmount () {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackHandler)
        }
    }

     // 物理返回
    onBackHandler = () => {
        if (Actions.currentScene == 'person') {
            if (this.lastBackPressed && this.lastBackPressed + 2000 >= Date.now()) {
                BackHandler.exitApp()
                return false; // 最近2秒内按过back键，可以退出此应用
            }
            this.lastBackPressed = Date.now();
            ToastAndroid.showWithGravityAndOffset('再按一次退出应用', ToastAndroid.SHORT, ToastAndroid.TOP, 0, 30);
            return true; // 默认行为
        }
    }

    // 检查版本是否最新
    checkUpdate () {
        CodePush.checkForUpdate().then((update) => {
            if (update) {
                this.setState({ showUpdate: true })
            }
        })
    }
    // 更新版本
    goUpdate () {
        CodePush.sync({
            //安装模式
            //ON_NEXT_RESUME 下次恢复到前台时
            //ON_NEXT_RESTART 下一次重启时
            //IMMEDIATE 马上更新
            installMode: CodePush.InstallMode.IMMEDIATE,
            //对话框
            updateDialog: {
                //是否显示更新描述
                appendReleaseDescription: true,
                //更新描述的前缀。 默认为"Description"
                descriptionPrefix: "更新内容：",
                //强制更新按钮文字，默认为continue
                mandatoryContinueButtonLabel: "立即更新",
                //强制更新时的信息. 默认为"An update is available that must be installed."
                mandatoryUpdateMessage: "必须更新后才能使用",
                //非强制更新时，按钮文字,默认为"ignore"
                optionalIgnoreButtonLabel: '稍后',
                //非强制更新时，确认按钮文字. 默认为"Install"
                optionalInstallButtonLabel: '后台更新',
                //非强制更新时，检查到更新的消息文本
                optionalUpdateMessage: '有新版本了，是否更新？',
                //Alert窗口的标题
                title: '更新提示'
            },
        },
            (status) => {
                console.log(status, 'status')
                if (status == 7) {
                    this.setState({ visitDialog: true })
                }
            },
            (progress) => {
                let receivedBytes = progress.receivedBytes / 1024 / 1024;
                let totalBytes = progress.totalBytes / 1024 / 1024;
                this.setState({
                    current: receivedBytes,
                    total: totalBytes
                })
                if (receivedBytes === totalBytes) {
                    setTimeout(() => {
                        this.setState({ visitDialog: false })
                    }, 1000)
                }
                console.log(progress, 'progress')
            }
        );
    }
    // 点击退出登录
    goBackLogin () {
        Actions.push('login')
    }
    render () {
        const { fullname } = this.props
        const { updateDate, versionNum, showUpdate = false, year } = this.state
        return (
            <ImageBackground style={styles.bgImage}
                source={imgList.bgImage}>
                <View style={styles.personContainer}>
                    <View>
                        <TouchableOpacity onPress={() => { Actions.pop() }}>
                            <Image style={styles.backIcon} source={imgList.backIcon} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.main}>
                        <View style={styles.topTitle}>
                            <Image style={styles.topTitleImg} source={imgList.topTitleImg} />
                            <Text style={styles.versionNum}>V{versionNum}</Text>
                        </View>
                        <View style={styles.info}>
                            <View style={styles.loginInfo}>
                                <Text style={styles.userFullName}>{fullname}</Text>
                                <Image style={styles.rightIcon} source={imgList.rightIcon} />
                            </View>
                            <View style={styles.update}>
                                <Text style={styles.check}>检查更新</Text>
                                {this.state.showUpdate ?
                                    <TouchableOpacity onPress={() => this.goUpdate()}>
                                        <Text style={styles.newVersion}>发现新版本</Text>
                                    </TouchableOpacity> :
                                    <Text style={styles.checkUpdate}>最新版本</Text>}
                            </View>
                            <View style={styles.company}>
                                <Image style={styles.companyLog}
                                    source={imgList.companyLog} />
                                <Text style={styles.companyText}>©{year} 无锡东领智能科技股份有限公司 版权所有</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => this.goBackLogin()}>
                            <Text style={styles.loginOut}>退出登录</Text>
                        </TouchableOpacity>
                        {this.state.visitDialog && <UpdateDialog
                            title={this.state.current === this.state.total ? '已完成' : '正在下载更新文件'}
                            describe={this.state.current === this.state.total ? '欢迎使用' : '请耐心等待'}
                            current={this.state.current} total={this.state.total}></UpdateDialog>}
                    </View>
                </View>
            </ImageBackground>
        );
    }
}
const styles = StyleSheet.create({
    bgImage: {
        flex: 1,
        resizeMode: "cover"
    },
    personContainer: {
        flex: 1,
    },
    backIcon: {
        width: setWidth(100),
        height: setHeight(100),
    },
    main: {
        marginHorizontal: setWidth(30),
    },
    topTitle: {
        marginTop: setHeight(320),
    },
    topTitleImg: {
        width: setWidth(280),
        height: setHeight(80),
    },
    versionNum: {
        marginTop: setHeight(20),
        marginBottom: setHeight(50),
        color: '#ffffff',
        opacity: 0.8,
        fontSize: setText(36)
    },
    info: {
        backgroundColor: '#ffffff',
        paddingLeft: setWidth(40),
        paddingRight: setWidth(40),
        borderRadius: 5
    },
    loginInfo: {
        height: setHeight(118),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: '#d9d9d9'
    },
    userFullName: {
        color: '#333333',
        fontSize: setText(36),
    },
    rightIcon: {
        width: setWidth(69),
        height: setHeight(71)
    },
    update: {
        height: setHeight(88),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: '#d9d9d9',
    },
    check: {
        fontSize: setText(32),
        color: '#333333'
    },
    checkUpdate: {
        fontSize: setText(28),
        color: '#8c8c8c'
    },
    newVersion: {
        color: '#ff6470',
        fontSize: setText(28)
    },
    company: {
        height: setHeight(160),
        paddingVertical : setHeight(6),
        justifyContent: 'center'
    },
    companyLog: {
        width: setWidth(230),
        height: setHeight(70)
    },
    companyText: {
        color: '#666666',
        fontSize: setText(24)
    },
    loginOut: {
        marginTop: setHeight(20),
        borderRadius: 5,
        height: setHeight(98),
        backgroundColor: "#ffffff",
        textAlign: 'center',
        lineHeight: setHeight(98),
        color: '#ff6470',
        fontSize: setText(42)
    }
})

const mapStateToProps = (state) => ({
    fullname: state.login.userInfo.fullname
});
const codePushOptions = {
    checkFrequency: CodePush.CheckFrequency.ON_APP_START
};

export default connect(mapStateToProps, codePushOptions)(Person);