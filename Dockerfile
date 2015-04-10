FROM centos:centos6

# Enable EPEL and install Node.js and npm
RUN rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm &&\
    yum install -y npm

# If you are going to install other dependencies, add them here, e.g.
# RUN   yum install -y some-dependency

# Build dependencies (if package.json has changed)
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app

# Add the application code
WORKDIR /opt/app
ADD . /opt/app

# Default port to expose
EXPOSE 8080
