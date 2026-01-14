import sys
import os

# Add your project directory to the sys.path
project_home = '/home/yourusername/earnings-analyser'  # CHANGE 'yourusername' to your actual username
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.chdir(project_home)

# Import FastAPI app
from main import app

# PythonAnywhere expects 'application'
application = app
