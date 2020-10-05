#!/bin/sh
set -o errexit

cd /app
npm install
npm start
