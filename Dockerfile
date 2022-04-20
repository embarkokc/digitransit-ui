# syntax = docker/dockerfile:1.4
FROM node:10 as builder

WORKDIR /opt/digitransit-ui

ENV \
  # We mimick common CI/CD systems so that tools don't assume a "normal" dev env.
  CI=true

COPY .yarnrc.yml package.json yarn.lock lerna.json ./
COPY .yarn ./.yarn

# todo: only copy */packages/*/package.json, not all of the code
# AFAIK there is no blob syntax that copies */package.json while keeping paths.
# https://github.com/moby/moby/issues/15858
COPY digitransit-util ./digitransit-util
COPY digitransit-search-util ./digitransit-search-util
COPY digitransit-component ./digitransit-component
COPY digitransit-store ./digitransit-store

RUN \
  # Tell Playwright not to download browser binaries, as it is only used for testing (not building).
  # https://github.com/microsoft/playwright/blob/v1.16.2/installation-tests/installation-tests.sh#L200-L216
  export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  && yarn install --immutable --immutable-cache --inline-builds \
  && rm -rf /tmp/phantomjs

# We create another image layer *without* .yarn/cache here, in order to copy the Yarn setup without the cache later.
RUN rm -r .yarn/cache

ADD . ${WORK}

RUN \
  yarn build && \
  rm -rf node_modules/.cache

FROM node:10
MAINTAINER Reittiopas version: 0.1

WORKDIR /opt/digitransit-ui

EXPOSE 8080

COPY .yarnrc.yml package.json yarn.lock lerna.json ./
COPY config ./config
COPY --from=builder /opt/digitransit-ui/.yarn ./.yarn

RUN \
  # install production dependencies only
  yarn install --production --immutable --immutable-cache --inline-builds

COPY digitransit-util ./digitransit-util
COPY digitransit-search-util ./digitransit-search-util
COPY digitransit-component ./digitransit-component
COPY digitransit-store ./digitransit-store
RUN yarn build-workspaces

ENV \
  # App specific settings to override when the image is run \
  SENTRY_DSN='' \
  SENTRY_SECRET_DSN='' \
  PORT=8080 \
  API_URL='' \
  MAP_URL='' \
  OTP_URL='' \
  GEOCODING_BASE_URL='' \
  APP_PATH='' \
  CONFIG='' \
  NODE_ENV='' \
  # setting a non-empty default value for NODE_OPTS
  # if you don't do this then yarn/node seem to think that you want to
  # execute a file called "" (empty string) and doesn't start the server
  # https://github.com/HSLdevcom/digitransit-ui/issues/4155
  #
  # the --title option just sets the harmless property process.title
  # https://nodejs.org/api/cli.html#cli_title_title
  NODE_OPTS='--title=digitransit-ui' \
  RELAY_FETCH_TIMEOUT='' \
  ASSET_URL='' \
  STATIC_MESSAGE_URL=''

ADD . ${WORK}

RUN \
  yarn build && \
  rm -rf static docs test /tmp/* .cache && \
  yarn cache clean --all

CMD yarn run start
