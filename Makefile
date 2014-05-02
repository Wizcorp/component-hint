##
# component-hint project Makefile
# description     : Makefile to install this project and its dependencies along with other helpers
# author          : Almir Kadric
# created on      : 2014-04-23
##


##
# Global variables
##

# Set default shell
SHELL = /bin/bash

# Function for help
define helpText

######################################
###         Component Hint         ###
######################################

make install         Install project dependencies
make dev             Install & setup project & development dependencies
make lint            Lint the entire project

endef
export helpText


##
# Make Targets
##

# List of target which should be run every time without caching
.PHONY: install dev lint


# Default make target
%::
	@echo "$$helpText"
Default :
	@echo "$$helpText"


# Install target
install :
	npm install --production

# Dev target
dev :
	npm install
	./sbin/lint.sh setup

# Lint target
lint :
	./sbin/lint.sh