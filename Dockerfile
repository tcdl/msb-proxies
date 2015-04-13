FROM centos:centos6

# Enable EPEL and install Node.js and npm
RUN rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm &&\
    yum install -y npm

# If you are going to install other dependencies, add them here, e.g.
# RUN   yum install -y some-dependency

# Build dependencies (if package.json has changed)
ADD package.json /tmp/package.json
RUN cd /tmp && npm install &&\
    mkdir -p /opt/msb-proxies && mv /tmp/node_modules /opt/msb-proxies

# Add the application code
WORKDIR /opt/msb-proxies
ADD . /opt/msb-proxies

# Make mountable directory
VOLUME ["/opt/msb-proxies/config"]

# Default config
ENV MSB_CONFIG_PATH=/opt/msb-proxies/config/msb.json

# Default port to expose
EXPOSE 8080
