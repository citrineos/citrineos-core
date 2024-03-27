FROM redis:6.2 as base

COPY /data/redis/redis.conf /usr/local/etc/redis/

CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]