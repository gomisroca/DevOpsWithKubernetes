FROM google/cloud-sdk:slim

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

USER 1000

ENTRYPOINT ["/app/backup.sh"]
