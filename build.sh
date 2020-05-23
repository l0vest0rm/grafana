#!/usr/bin/env bash

basepath=$(cd `dirname $0`; pwd)

cd $basepath

go run build.go build-server
go run build.go build-frontend
rm -f public.tgz
tar czf public.tgz public