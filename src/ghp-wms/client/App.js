import React, { Component } from 'react';
import Root from './src';
import configureStore from './src/store';
import UpdateDialog from './src/components/updateDialog'
import CodePush from "react-native-code-push";
const { persistor, store } = configureStore();


class App extends Component {
  lastBackPress = Date.now();
  state = {
    visitDialog: false,
    current: 0,
    total: 100
  }

  componentWillUnmount () {
  }


  componentDidMount () {
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
      }
    );
  }



  render () {
    return (
      <>
        <Root store={store} persistor={persistor} />
        {this.state.visitDialog && <UpdateDialog
          title={this.state.current === this.state.total ? '已完成' : '正在下载更新文件'}
          describe={this.state.current === this.state.total ? '欢迎使用' : '请耐心等待'}
          current={this.state.current} total={this.state.total}></UpdateDialog>}
      </>
    )
  }
};

let codePushOptions = {
  //设置检查更新的频率
  //ON_APP_RESUME APP恢复到前台的时候
  //ON_APP_START APP开启的时候
  //MANUAL 手动检查
  checkFrequency: CodePush.CheckFrequency.ON_APP_START
};

export default CodePush(codePushOptions)(App);
