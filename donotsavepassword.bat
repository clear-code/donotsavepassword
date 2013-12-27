set appname=donotsavepassword

copy buildscript\makexpi.sh .\
bash makexpi.sh -n %appname%
del makexpi.sh
