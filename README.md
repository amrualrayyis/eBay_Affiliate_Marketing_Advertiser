# AI Affiliate Content Automation Pipeline

A modular Node.js workflow that discovers eBay products, evaluates candidates with Gemini, creates channel-specific content, processes images, and delivers review-ready outputs through Discord.

## Overview

This portfolio project demonstrates an end-to-end automation pipeline integrating external APIs, generative AI, image processing, lightweight state management, and operational reporting.

The system:

1. Loads a configurable niche catalogue
2. Queries the eBay Browse API
3. Excludes previously processed products
4. Uses Gemini to select and describe a candidate when configured
5. Generates channel-specific copy and creative prompts
6. Downloads and brands product imagery
7. Creates evergreen affiliate links
8. Sends a structured review package to Discord
9. Logs activity for later reporting

## Architecture

```text
Niche configuration
        ↓
eBay Browse API
        ↓
Candidate deduplication
        ↓
Optional Gemini ranking
        ↓
Content-pack generation
        ↓
Image processing and link generation
        ↓
Discord delivery + CSV logging
        ↓
Weekly operational report
```

## Engineering features

- Modular Node.js design
- Environment-based credential isolation
- Duplicate suppression through persistent item history
- Graceful AI fallback behavior
- Dynamic Gemini model selection
- Multi-channel content generation
- Image download, branding, collage, and hosting support
- Discord webhook integration
- CSV logging and weekly summary reporting
- Batch scripts for repeatable daily and weekly execution

## Technology

- Node.js
- eBay Browse API
- Google Gemini API
- Discord webhooks
- Jimp image processing
- ImgBB
- CSV-based operational logging

## Setup

```bash
npm install
cp .env.example .env
npm run daily
```

Populate only the services you plan to use. Optional integrations degrade gracefully when their credentials are not configured.

## Configuration

See `.env.example` for supported variables.

## Suggested scripts

```bash
npm run daily
npm run weekly
npm run report
```

## Security

No production credentials belong in source control. Keep `.env`, generated images, logs, and local state files excluded through `.gitignore`.

## Portfolio note

This is a sanitized portfolio repository. It is intended to demonstrate integration design, modular automation, LLM-assisted processing, and operational controls rather than serve as a turnkey commercial affiliate system.
