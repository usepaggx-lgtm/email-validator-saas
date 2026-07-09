#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git
npm install -g pm2
mkdir -p /data/sessions
chmod 777 /data/sessions
