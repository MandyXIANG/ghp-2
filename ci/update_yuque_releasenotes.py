'''
@File: update_yuque_releasenotes.py
@Description: Auto update releasenotes document on Yuque
@Author: leon.li(l2m2lq@gmail.com)
@Date: 2020-04-03 09:08:03
'''

import requests, os, json, re
import smtplib
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email import encoders

def beautify(changelog):
  """
  beautify for Yuque markdown content
  """
  v1 = re.sub(r'BUG#(\d+)', r'BUG[#\1](http://zentao.topibd.net/zentao/bug-view-\1.html)', changelog, flags=re.IGNORECASE)
  v2 = re.sub(r'需求#(\d+)', r'需求[#\1](http://zentao.topibd.net/zentao/story-view-\1.html)', v1)
  return v2

def beautify2(changelog):
  """
  beautify for mail content
  """
  v0 = '<br />'.join(changelog.split('\n'))
  v1 = re.sub(r'BUG#(\d+)', r'BUG<a href=http://zentao.topibd.net/zentao/bug-view-\1.html>#\1</a>', v0, flags=re.IGNORECASE)
  v2 = re.sub(r'需求#(\d+)', r'需求<a href=http://zentao.topibd.net/zentao/story-view-\1.html>#\1</a>', v1)
  return v2

def update_yuque(repo_id, doc_id, *, body):
  headers = {
    'X-Auth-Token': yuque_info['token'],
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  base_url = yuque_info['api_base_url']
  url = f'{base_url}/repos/{repo_id}/docs/{doc_id}'
  print(url)
  data = {
    'format': 'markdown',
    'body': body
  }
  response = requests.request(method='PUT', url=url, headers=headers, data=data, timeout=yuque_info['timeout'])
  if response.status_code != 200:
    print(f'Update yuque doc failed. status_code = {response.status_code}, response = {response.text}')

def _parser_changelog(changelog_filepath):
  with open(changelog_filepath, 'r', encoding='utf-8') as f:
    content = f.read()
  m = re.search(r'^.*##\s*(\d+\.\d+.\d+)\s.*\n((.+\n)+)', content)
  return (m[1], m[2])

def send_mail(to, cc):
  smtp = smtplib.SMTP(mail_info['host'], mail_info['port'])
  smtp.connect(mail_info['host'], mail_info['port'])
  smtp.login(mail_info['user'], mail_info['password'])
  message = MIMEMultipart()
  message['Subject'] = Header(f'{module_info["module_name_zhcn"]}模组 {changelog_info[0]} 发布', 'utf-8')
  message['From'] = mail_info['user']
  message['To'] = ','.join(to)
  if cc:
    message['Cc'] = ','.join(cc)
  contents = []
  contents.append('Dear All, ')
  contents.append('')
  contents.append(f'<b>{module_info["module_name_zhcn"]} {changelog_info[0]} 发布</b>')
  contents.append(f'{beautify2(changelog_info[1])}')
  contents.append(f'历史版本信息请移步<a href={yuque_info["releasenotes_url"]}>语雀</a>查看')
  contents.append('')
  message.attach(MIMEText('<br />'.join(contents), 'html', 'utf-8'))
  smtp.sendmail(
    mail_info['user'], 
    to + cc,
    message.as_string()
  )
  smtp.quit()

def run():
  global module_info
  global yuque_info
  global mail_info
  global changelog_info
  with open(os.path.join(ci_script_dir, '../module.json'), 'r', encoding='utf-8') as f:
    module_info = json.load(f)
  with open(os.path.join(ci_script_dir, 'yuque.json'), 'r', encoding='utf-8') as f:
    yuque_info = json.load(f)
  with open(os.path.join(ci_script_dir, 'mail.json'), 'r', encoding='utf-8') as f:
    mail_config_info = json.load(f)
    r = requests.get(mail_config_info["hook"])
    if r.status_code != 200:
      print(f'get mail list failed. status_code: {r.status_code}')
      return 
    r_data = json.loads(r.content)
    mail_info = r_data["data"]
  changelog_filepath = os.path.join(ci_script_dir, '../CHANGELOG.md')
  changelog_info = _parser_changelog(changelog_filepath)
  with open(changelog_filepath, 'r', encoding='utf-8') as f:
    content = f.read()
    update_yuque(yuque_info['repo_id'], yuque_info['doc_id'], body=beautify(content))
  send_mail(mail_info["to"], mail_info["cc"])

if __name__ == "__main__":
  global ci_script_dir
  ci_script_dir = os.path.dirname(os.path.realpath(__file__))
  run()