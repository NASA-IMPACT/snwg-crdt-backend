FROM node:lts-bookworm AS base

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        bash g++ make \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY ./package.json ./pnpm-lock.yaml /code/
COPY ./patches /code/patches

WORKDIR /code
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
