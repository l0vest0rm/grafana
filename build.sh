#!/usr/bin/env bash

basepath=$(cd `dirname $0`; pwd)

cd $basepath

go run build.go build-server
if [ $? -eq 0 ]; then
    echo "build backend success"
else
    echo "build backend failed"
fi
date
go run build.go build-frontend
if [ $? -eq 0 ]; then
    rm -f /root/public.tgz
    tar czf /root/public.tgz public
    scp /root/public.tgz root@172.26.61.202:/root/
    scp /root/public.tgz root@172.26.61.207:/root/

    rm -f /root/grafana-server
    mv $basepath/bin/linux-amd64/grafana-server /root/
    scp /root/grafana-server root@172.26.61.202:/root/
    scp /root/grafana-server root@172.26.61.207:/root/
    echo "build frontend success"
else
    echo "build frontend failed"
fi
date