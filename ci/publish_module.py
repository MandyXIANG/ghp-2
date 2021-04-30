'''
@File: publish_module.py
@Description: Moudle Publish Script
@Author: leon.li(l2m2lq@gmail.com)
@Date: 2020-02-11 15:08:46
'''

import platform
import os
import time
import argparse
import sys
import subprocess
import glob
import re
import shutil
import json
import requests
import urllib
import qtciutil
from dingdinghelper import DingDingHelper

dingding_cfg = {
  "msgurl": "https://oapi.dingtalk.com/robot/send?access_token=e02a2c7de529ca83ba5d4e6f6c37b31f53152b3dc54d30653ed2235723027651",
  "corpid": "ding428c9b6bb8962a4d35c2f4657eb6378f",
  "corpsecret": "L8v6TYuSnjq8VsErPiCoJdWU19T5Embn1P8KW7IyO3_FkJw_ZLPqdKt6blQwwd34",
  "spaceid": 483476421
}

def _parser_readme(readme_filepath):
  if not os.path.isfile(readme_filepath):
    raise qtciutil.QtCiUtilError("No %s found." % readme_filepath)
  with open(readme_filepath, 'r', encoding='utf-8') as f:
    content = f.read()
  m = re.search(r'^#(.*)\n', content)
  if not m:
    raise qtciutil.QtCiUtilError('The README file is not in the right format.')
  return m[1]

def _parser_changelog(changelog_filepath):
  if not os.path.isfile(changelog_filepath):
    raise qtciutil.QtCiUtilError("No %s found." % changelog_filepath)
  with open(changelog_filepath, 'r', encoding='utf-8') as f:
    content = f.read()
  m = re.search(r'^.*##\s*(\d+\.\d+.\d+)\s.*\n((.+\n)+)', content)
  if not m:
    raise qtciutil.QtCiUtilError('The CHANGELOG file is not in the right format.')
  return (m[1], m[2])

def _parser_module_config(module_json_filepath):
  if not os.path.isfile(module_json_filepath):
    raise qtciutil.QtCiUtilError("No %s found." % module_json_filepath)
  with open(module_json_filepath, 'r', encoding='utf-8') as f:
    content = f.read()
  moduleconf_json = json.loads(content)
  tmp_name = moduleconf_json.get('module_name', '')
  hook = moduleconf_json.get('hook', '')
  database_names = []
  if (hook != ''):
    param = urllib.parse.urlencode({'module_name': tmp_name}, quote_via=urllib.parse.quote)
    r = requests.get(hook, params=param)
    if (r.status_code != 200):
      exit(1)
    hook_ret = r.json()
    hook_data = hook_ret.get('data', {})
    for key in hook_data:
      urls = key.split('/')
      urls.reverse()
      database_names.append(urls[1])
  return ', '.join(database_names)

def package():
  dist_dir = os.path.join(ci_script_dir, '../dist/')
  os.environ["PATH"] = os.environ['QT_BIN'] + os.pathsep + os.environ["PATH"]
  package_name = '{name}-{version}-upgrade-{dt}'.format(
    name=module_name, 
    version=version, 
    dt = time.strftime("%Y%m%d%H%M")
  )

  archive_dir = os.path.join(ci_script_dir, '../archive/')
  packaging_dist = os.path.join(ci_script_dir, '../archive/%s/' % package_name)
  if os.path.isdir(archive_dir):
    shutil.rmtree(archive_dir, ignore_errors=True)
  os.makedirs(packaging_dist)

  package_program_filepath = ''
  package_config_filepath = os.path.join(ci_script_dir, 'upgrade-package-{}.json'.format(platform.system().lower()))
  # modify release_note
  module_json_filepath = os.path.join(ci_script_dir, '../module.json')
  with open(module_json_filepath, 'r', encoding= 'utf-8') as f:
    moduleconf_content = f.read()
    moduleconf_json = json.loads(moduleconf_content)
    moduleconf_json['version'] = version
    moduleconf_json['change_log'] = changelog
    moduleconf_json['is_module'] = 1
    moduleconf_json['remark'] = 'Update package is automatically published by CI.'
  with open(package_config_filepath, 'r', encoding= 'utf-8') as f:
    package_config_content = f.read()
    content_json = json.loads(package_config_content)
    content_str = json.dumps(moduleconf_json, ensure_ascii=False)
    content_json['release_note'] = content_str
  with open(package_config_filepath, 'w', encoding='utf-8') as f:
    json.dump(content_json, f, ensure_ascii=False, indent=4)
  package_output_filepath = "%s/%s.pkg" % (packaging_dist, package_name)
  if platform.system() == 'Windows':
    package_program_filepath = dist_dir + "/topikm/qt5.6.3-win32-msvc2015/bin/TopUpgradePackager.exe"
  elif platform.system() == 'Linux':
    package_program_filepath = dist_dir + "/topikm/qt5.6.3-linuxx86_64/bin/TopUpgradePackager"
  
  package_args = [
    package_program_filepath, 
    '-c', package_config_filepath, 
    '-d', package_output_filepath,
    '-H', 'yes'
  ]
  print("package_args: ", package_args)
  pinfo = subprocess.run(package_args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
  print(pinfo.stdout.decode('utf-8'))
  if pinfo.returncode != 0:
    raise qtciutil.QtCiUtilError("package failed.")

  # Copy README.md and CHANGELOG.md
  shutil.copy(os.path.join(ci_script_dir, '../README.md'), packaging_dist)
  shutil.copy(os.path.join(ci_script_dir, '../CHANGELOG.md'), packaging_dist)

  # upload to database
  # upload_program_filepath = ''
  # if platform.system() == 'Windows':
  #   upload_program_filepath = dist_dir + "/topikm/qt5.6.3-win32-msvc2015/bin/PackageUploaderPlus.exe"
  # elif platform.system() == 'Linux':
  #   upload_program_filepath = dist_dir + "/topikm/qt5.6.3-linuxx86_64/bin/PackageUploaderPlus"
  # upload_args = [
  #   upload_program_filepath,
  #   '-u', package_output_filepath,
  #   module_json_filepath
  # ]
  # pinfo = subprocess.run(upload_args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
  # if pinfo.returncode != 0:
  #   raise qtciutil.QtCiUtilError("upload failed. %s" % pinfo.stdout.decode('utf-8'))

  os.chdir(os.path.join(ci_script_dir, '../archive/'))
  if platform.system() == 'Linux':
    shutil.make_archive(package_name, 'gztar', base_dir=package_name)
    archive_filepath = os.path.join(os.getcwd(), package_name + ".tar.gz")
  elif platform.system() == 'Windows':
    shutil.make_archive(package_name, 'zip', base_dir=package_name)
    archive_filepath = os.path.join(os.getcwd(), package_name + ".zip")
  else:
    raise qtciutil.QtCiUtilError('This platform is currently not supported.')

  return archive_filepath

def sendToDingding(archive_filepath):
  ding = DingDingHelper()
  ding.msgurl = dingding_cfg["msgurl"]
  ding.corpid = dingding_cfg["corpid"]
  ding.corpsecret = dingding_cfg["corpsecret"]

  r = requests.get("http://139.196.104.13:9181/api/_/dingding/getCookie")
  if r.status_code != 200:
    exit(1)
  r_data = json.loads(r.content)
  ding.cookie = r_data["data"].rstrip()

  spacepath = '/custom/ghp/{module_name}/{os}/'.format(
    module_name = module_name,
    os = platform.system().lower()
  )
  ding.upload_file(archive_filepath, dingding_cfg["spaceid"], spacepath)
  msg = []
  msg.append("{module_name} {version} {os} 发布".format(
    module_name =module_name,
    version = version,
    os = platform.system()
  ))
  msg.append(changelog)
  msg.append("模组升级包已上传至钉盘目录{dir}下。".format(dir=spacepath))
  # msg.append("已执行更新包上传工具进行上传({dbname})，请检查相关数据库sys_conf表中的模组版本，若失败请手动升级。".format(dbname=database_name))
  print('\n'.join(msg))
  ding.send_msg('\n'.join(msg))

if __name__ == "__main__":
  global ci_script_dir
  global module_name
  global version
  global changelog
  global database_name
  ci_script_dir = os.path.dirname(os.path.realpath(__file__))
  module_name = _parser_readme(os.path.join(ci_script_dir, '../README.md')).strip()
  print("module_name: %s" % module_name)
  changelog_info = _parser_changelog(os.path.join(ci_script_dir, '../CHANGELOG.md'))
  version = changelog_info[0]
  print("version: %s" % version)
  changelog = changelog_info[1]
  print("changelog: %s" % changelog)
  database_name = _parser_module_config(os.path.join(ci_script_dir, '../module.json'))
  archive_filepath = package()
  print("archive_filepath: %s" % archive_filepath)
  sendToDingding(archive_filepath)
  