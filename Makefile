PACKAGE_NAME = donotsavepassword

all: xpi

xpi:
	./makexpi.sh -n $(PACKAGE_NAME)
