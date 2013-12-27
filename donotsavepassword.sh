#!/bin/sh

appname=donotsavepassword

cp buildscript/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh

