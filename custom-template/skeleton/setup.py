from distutils.core import setup

setup(name = '${{values.name}}',
      version= '1.0', 
      description='${{values.propertyA}}',
      {% if values.propertyA %}
      author_email='dmeriki@gmail.com',
      {% endif %}
      author='Meriki',
      url='',
      packages=['distutils', 'distutils.command'],
      )
