'''
@File: build.py
@Description: CI Build Script
@Author: leon.li(l2m2lq@gmail.com)
@Date: 2019-09-12 08:53:45
'''

import argparse
import sys
import qtciutil
import os
import subprocess
import shutil


def sincpm_bin(cmd):
  return qtciutil.common_cmd('SINCPM_BIN', cmd)


def sincpm_update():
  # check sincpm.json if exists
  filepath = os.path.join(ci_script_dir, "../sincpm.json")
  if not os.path.isfile(filepath):
    return

  # get platform infomation
  qt_verison_str = qtciutil.qt_version()
  qmake_spec_str = qtciutil.qmake_spec()
  compiler_str = qmake_spec_str.split('-')[1]
  if compiler_str == 'g++':
    compiler_str = 'gcc'
  os_system = qtciutil.platform_system()
  arch_str = 'x64'
  if os_system == 'windows':
    arch_str = 'x86'

  # sincpm update
  update_args = [sincpm_bin('sincpm'), 'update']
  update_args.append('--os=%s' % os_system)
  update_args.append('--qt=%s' % qt_verison_str)
  update_args.append('--compiler=%s' % compiler_str)
  update_args.append('--arch=%s' % arch_str)
  print("update_args: ", update_args)
  pinfo = subprocess.run(
      update_args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
  if pinfo.returncode != 0:
    raise qtciutil.QtCiUtilError("sincpm update failed.")


def copy_x():
  # template
  src_template_dir = os.path.join(ci_script_dir, "../src/template/")
  dst_template_dir = os.path.join(ci_script_dir, "../dist/topikm/template/")
  if os.path.isdir(src_template_dir):
    if os.path.exists(dst_template_dir):
      shutil.rmtree(dst_template_dir)
    shutil.copytree(src_template_dir, dst_template_dir)
  # resource
  src_resource_dir = os.path.join(ci_script_dir, "../src/resource/")
  dst_resource_dir = os.path.join(
      ci_script_dir, "../dist/topikm/qt5.6.3-win32-msvc2015/resource/")
  if os.path.isdir(src_resource_dir):
    if os.path.exists(dst_resource_dir):
      shutil.rmtree(dst_resource_dir)
    shutil.copytree(src_resource_dir, dst_resource_dir)


if __name__ == "__main__":
  global ci_script_dir
  parser = argparse.ArgumentParser(description='Build Arg Parser')
  parser.add_argument('--pro_file', '-p', type=str, required=True,
                      help='pro path', metavar='$CI_PROJECT_DIR/src/something.pro')
  parser.add_argument('--build_dir', '-b', type=str, required=True,
                      help='build directory', metavar='$CI_PROJECT_DIR/build')
  parser.add_argument('--mode', '-m', type=str, required=True,
                      help='debug or release', metavar='release')
  args = vars(parser.parse_args())
  pro_file = args['pro_file']
  build_dir = args['build_dir']
  mode = args['mode']
  ci_script_dir = os.path.dirname(os.path.realpath(__file__))
  sincpm_update()
  copy_x()
  qtciutil.build(pro_file, build_dir, mode)
