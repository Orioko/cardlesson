# syntax=docker/dockerfile:1
# Сборка из папки backend: docker build -t cardlesson-api .

FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test ./... \
 && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/cardlesson ./cmd/cardlesson

FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata \
 && adduser -D -H -u 10001 cardlesson \
 && mkdir -p /data && chown cardlesson /data
COPY --from=build /out/cardlesson /usr/local/bin/cardlesson
ENV CARDLESSON_ADDR=:8080 \
    CARDLESSON_DB=/data/cardlesson.db \
    CARDLESSON_TRUST_PROXY=1
USER cardlesson
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD ["cardlesson", "healthcheck"]
ENTRYPOINT ["cardlesson"]
CMD ["serve"]
