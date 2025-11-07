#!/bin/sh
URL=$(curl -sI https://en.wikipedia.org/wiki/Special:Random | grep -i Location | awk '{print $2}' | tr -d '\r')

echo "Adding todo: Read $URL"

psql "$DATABASE_URL" -c "INSERT INTO todos (text) VALUES ('Read $URL');"
