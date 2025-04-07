import sys
import os

venv_bin = os.path.dirname(__file__)

site_packages = os.path.join(venv_bin, '..', 'lib', 'python' + sys.version[:3], 'site_packages')
sys.path.insert(0, site_packages)

os.environ['VIRTUAL_ENV'] = venv_bin
os.environ['PATH'] = os.path.join(venv_bin, 'bin') + ':' + os.environ['PATH']


