## 打包时需要修改热更新相关配置：key,hot_url(android); 后端服务地址(config)；applicationId;

## TopMES app
## 139测试环境
* 后端服务地址:http://139.196.104.13:9181/api/TOPMES6_GHP_V6/ghp-spumes-app
* 热更新地址:http://139.196.104.13:3094
* 热更新的key:FHOIQ0LHm3QXoWXZzflR3CFPUVSD4ksvOXqog  
* 热更新环境是:Production
* app在3094推送中心的name是:ghp-spumes-pad
* applicationId:com.ghp.spumes.pad
* appname:TopMES
* 登陆页面名字:TopMES
* 开发推送命令:code-push release-react ghp-spumes-pad android -d Production

## 192客户环境
* 后端服务地址:http://192.168.15.11:9181/api/TOPMES6_GHP_V6/ghp-spumes-app
* 热更新地址:http://192.168.15.11:3095
* 热更新的key:KZF91YYXdwSebDVp2SCDUyxK25LH4ksvOXqog
* 热更新环境是:Production
* app在3095推送中心的name是:ghp-spumes-pad
* applicationId: com.ghp.spumes.pad
* appname:TopMES
* 登陆页面名字:TopMES
* 生成热更新文件命令：react-native bundle --entry-file index.js --bundle-output ./bundle/android/index.android.bundle --platform android --assets-dest ./bundle/android --dev false
* 推送命令：code-push release-react ghp-spumes-pad android -d Production