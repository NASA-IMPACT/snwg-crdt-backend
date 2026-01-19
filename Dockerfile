FROM node:lts-bookworm AS dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        bash g++ make \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /code

COPY ./package.json ./pnpm-lock.yaml /code/
COPY ./patches /code/patches

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM dev as prod

WORKDIR /code

COPY . /code

RUN pnpm tsoa:generate

ENV NODE_ENV=production
