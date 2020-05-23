#!/usr/bin/env bash

basepath=$(cd `dirname $0`; pwd)

cd $basepath

go run build.go build-server
go run build.go build-frontend
if [ $? -eq 0 ]; then
    rm -f public.tgz
    tar czf public.tgz public
    scp $basepath/public.tgz root@172.26.61.202:/root/
    scp $basepath/public.tgz root@172.26.61.207:/root/
    scp $basepath/bin/linux-amd64/grafana-server root@172.26.61.202:/root/
    scp $basepath/bin/linux-amd64/grafana-server root@172.26.61.207:/root/
    echo "succeed"
else
    echo "failed"
fi
