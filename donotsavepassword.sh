#!/bin/sh

appname=donotsavepassword

cp buildscript/makexpi.sh ./
./makexpi.sh -n $appname
rm ./makexpi.sh

