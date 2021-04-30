## 打包时需要修改热更新相关配置：key,hot_url ;后端服务地址； applicationId; 


## TopMES app
## 139测试环境
* 后端服务地址:http://139.196.104.13:9181/api/TOPMES6_GHP_V6/ghp-spumes-app
* 热更新地址:http://139.196.104.13:3094
* 热更新的key: pksh4UfNaqdigSgJJiImvKP5WquT4ksvOXqog
* 热更新环境是：Production
* app在3094推送中心的name是:ghp-spumes
* applicationId: com.ghp.spumes
* appname:TopMES
* 登陆页面名字：TopMES
* 开发推送命令：code-push release-react ghp-spumes android -d Production
## 192客户环境
* 后端服务地址:http://192.168.15.11:9181/api/TOPMES6_GHP_V6/ghp-spumes-app
* 热更新地址:http://192.168.15.11:3095
* 热更新的key:0w4dWkEhyf4gWTrs5XI0cld9TWnl4ksvOXqog
* 热更新环境是:Production
* app在3094推送中心的name是:ghp-spumes-mobile
* applicationId: com.ghp.spumes
* appname:TopMES
* 登陆页面名字:TopMES
* 先连vpn 登录到客户的3095服务器再推送
* 推送命令：code-push release-react ghp-spumes-mobile android -d Production