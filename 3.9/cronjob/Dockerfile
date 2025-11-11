FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache curl postgresql-client bash

COPY add_todo.sh .

RUN chmod +x add_todo.sh

EXPOSE 8080

CMD ["/app/add_todo.sh"]
