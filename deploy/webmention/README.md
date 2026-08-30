# WebMention 接收端

本站使用 [webmentiond](https://github.com/zerok/webmentiond) 作为自托管接收端。它负责异步验证来源页面、将结果存入 SQLite，并提供审核后台与公开查询 API。Twikoo 继续作为站内评论系统，两者互不替代。

## 1. 准备域名

将 `webmention.example.com` 解析到运行 Docker 的服务器。如果要换成其他域名，同时修改：

- `src/site.config.ts` 中的 `webmentions.endpoint`
- `.env` 中的 `WEBMENTION_PUBLIC_URL`
- Caddy 或 Nginx 的域名

接收端必须使用公网可访问的 HTTPS 地址。

## 2. 配置并启动

在服务器上进入本目录，复制示例环境变量并填写真实值：

```sh
cp .env.example .env
docker compose pull
docker compose up -d
```

Compose 会先用一次性 `webmention-init` 容器将数据卷所有者设为 webmentiond 使用的 UID 1500，然后再启动接收端。若曾使用旧版 Compose，并在日志中看到 `unable to open database file`，可在部署目录执行：

```sh
docker compose stop webmentiond
docker compose run --rm --no-deps --user 0 --entrypoint /bin/sh webmentiond -c 'chown -R 1500:1500 /data'
docker compose up -d webmentiond
```

必须修改以下值：

- `WEBMENTION_ADMIN_EMAILS`：允许登录审核后台的邮箱，可用逗号分隔多个地址。
- `SERVER_AUTH_JWT_SECRET`：长随机字符串，可用 `openssl rand -hex 32` 生成。
- `MAIL_*`：SMTP 地址、账号、密码和发件人。后台使用邮件链接登录，因此 SMTP 不能省略。

SQLite 数据保存在 Docker 卷 `webmention-data`。更新容器不会删除它，仍建议定期备份该卷。

## 3. 配置反向代理

任选 `Caddyfile.example` 或 `nginx.conf.example` 作为反向代理参考。容器只监听服务器本机的 `127.0.0.1:8080`，TLS 由反向代理处理。

部署完成后访问：

```text
https://webmention.example.com/ui/
```

输入 `WEBMENTION_ADMIN_EMAILS` 中的邮箱，通过邮件链接登录。收到的 WebMention 验证成功后仍需在这里批准，批准后才会出现在博客文章底部。

## 4. 接口与站点集成

博客构建结果会在 `<head>` 中自动声明：

```html
<link rel="webmention" href="https://webmention.example.com/receive">
```

文章页通过以下接口读取当前 canonical URL 已批准的项目：

```text
GET https://webmention.example.com/get?target=https://www.example.com/posts/example/
```

文章底部也提供发送表单，POST `source` 和 `target` 到 `/receive`。`WEBMENTION_ALLOWED_ORIGIN` 必须与博客的浏览器 Origin 完全一致，否则读取与发送都会被 CORS 拦截。

## 5. 验证

完成接收端和博客部署后：

1. 查看任一文章源码，确认存在 `rel="webmention"`。
2. 打开 `https://webmention.example.com/ui/`，确认可以收到登录邮件。
3. 使用 [webmention.rocks](https://webmention.rocks/) 检查接收端标准兼容性。
4. 从一个确实包含本站文章链接的公开页面发送 WebMention。
5. 在管理后台批准后，刷新对应文章，确认它出现在“站外回应”。

`webmentiond` 按完整 target URL 精确查询。发送方若将带 `#fragment` 的链接作为 target，它会被视为与文章 canonical URL 不同的目标；建议发送时使用不带锚点的文章永久链接。
