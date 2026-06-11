# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - TBD

### Added

- Initial release.
- MCP server over stdio exposing 33 tools for the prompty.tools platform:
  prompts (search, get, versions, create, update, visibility), personas
  (same surface), tones, outputs, constraints (search, get, create, update),
  and libraries (search, get, prompts, create, update, membership).
- Server-side prompt compilation workflow: prompts are created from a task
  plus building-block references; the platform compiles the final text.
- Typed error surfacing from `@prompty-tools/core`, including rate-limit
  details on HTTP 429.
- Static documentation site generated from the registered tool schemas.
