#!/bin/bash

if [ $TRAVIS_PULL_REQUEST != false ]; then
	echo "PR - exiting early"
	exit 0
fi

exit 1