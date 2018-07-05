FROM golang:1-alpine AS backend_builder

RUN apk add --no-cache git ca-certificates
RUN wget -qO /usr/local/bin/dep https://github.com/golang/dep/releases/download/v0.4.1/dep-linux-amd64
RUN chmod +x /usr/local/bin/dep

COPY Gopkg.lock Gopkg.toml /go/src/maunium.net/go/lindeb/
WORKDIR /go/src/maunium.net/go/lindeb
RUN dep ensure -vendor-only

COPY . /go/src/maunium.net/go/lindeb
RUN CGO_ENABLED=0 go build -o /usr/bin/lindeb

FROM node:8-stretch AS frontend_builder

COPY ./frontend /frontend
WORKDIR /frontend
RUN npm install
RUN npm run build

FROM scratch

COPY --from=backend_builder /usr/bin/lindeb /usr/bin/lindeb
COPY --from=backend_builder /etc/ssl/certs/ /etc/ssl/certs
COPY --from=frontend_builder /frontend/dist /var/www/html

CMD ["/usr/bin/lindeb", "-c", "/etc/lindeb/config.yaml"]
