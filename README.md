# ghp2-topmes-module

[![pipeline status](http://gitlab.topibd.net/ghp2/ghp2-topmes-module/badges/master/pipeline.svg)](http://gitlab.topibd.net/ghp2/ghp2-topmes-module/commits/master)
[![pipeline status](http://gitlab.topibd.net/ghp2/ghp2-topmes-module/badges/develop/pipeline.svg)](http://gitlab.topibd.net/ghp2/ghp2-topmes-module/commits/develop)

## 目录

```
|--src
|  |--module/ 项目配置
|  |  |--__sys_enum__/ 枚举
|  |  |--__sys_permission__/ 权限
|  |  |--sys-user-mgt/ 定制的模块
|  |--template/ 项目上需要用到的模板文件，例如Excel等
|  |  |--*.xlsx
|  |--resource/ 项目上用到的资源文件，例如背景图片等
|  |--server/ 服务端的一些脚本，配置
|  |--conf/ 该项目的手动创建类的配置
|  |  |--dynamic-form/ 动态表单配置
|  |  |--chart-developer/ 图表开发者配置
```

## 自动发布

- 只要将代码合并到master分支，就会触发自动发布

- 发布时会正则解析CHANGELOG.md，以此来生成发布日志. CHANGELOG编写规则[在这里](https://toplinker.yuque.com/sar5up/vg7r9r/hn6kry)

## CI配置相关

通常，需要修改以下文件

### yuque.json

```json
{
  "token": "86LSHNZHSC4RBuy0G8HCapr3FL36RlHbsix2HG9C",
  "api_base_url": "https://toplinker.yuque.com/api/v2",
  "releasenotes_url": "https://toplinker.yuque.com/toplinker/vtgsv9/qcvexa",
  "repo_id": 902137,
  "doc_id": 5827831,
  "timeout": 10
}
```

releasenotes_url： Release Notes在语雀上的链接

repo_id: 知识库ID

doc_id: 文档ID

### upgrade-package-windows.json

如果是标准目录，无需修改此文件。

如果不是，需要修改对应项。