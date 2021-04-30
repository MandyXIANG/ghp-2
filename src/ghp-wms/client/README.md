## 打包命令：android 目录下: .\gradlew.bat assembleRelease

## 139 测试环境

- 后端地址:http://139.196.104.13:9181/api/TOPMES6_GHP_V6/ghp-wms-app
- 热更新服务地址：http://139.196.104.13:3094
- 推送中心 app 名称:ghp-wms
- 热更新环境分支:Production
- 环境分支 Key:W2jA3W5kBKxZYejOdEI2PAYjWJJ64ksvOXqog
- 推送命令：code-push release-react ghp-wms android -d Production


## 客户环境
- 后端地址:http://192.168.15.11:9181/api/TOPMES6_GHP_V6/ghp-wms-app
- 热更新服务地址：http://192.168.15.11:3095
- 推送中心 app 名称:ghp-wms
- 热更新环境分支:Production
- 环境分支 Key:4QudJuV8niuG01LwwppVixMchGO24ksvOXqog
- 生成热更新文件命令：react-native bundle --entry-file index.js --bundle-output ./bundle/android/index.android.bundle --platform android --assets-dest ./bundle/android --dev false