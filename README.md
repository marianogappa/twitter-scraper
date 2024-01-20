# twitter-scraper

Scrape & stream tweets on an arbitrary number of profiles or search terms.

https://github.com/marianogappa/twitter-scraper/assets/1078546/c3d0a4ee-dec4-449d-855d-f80cfd17fb09

## Installation

The script can be downloaded and ran with:

```
node main.js
```

The only dependency is puppeteer:

```
npm install puppeteer
```

## Configuration

A Twitter login must be provided via environment variables:

```
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
```

The `config.json.default` contains all possible configurations, with sensible defaults. Don't modify this file. Instead, create a `config.json` with your overrides.

The most useful configurations:

```
urls: ['https://twitter.com/nytimes'], // The profile pages you want to scrape tweets from
searchTerms: ['cats'],                 // The search terms you want to scrape tweets from
tweetsPerPage: 5,                      // How many tweets to scrape from each url
```

## Morality caveat

Don't use this tool to DDoS Twitter. Only use it for short unintrusive experiments. Otherwise, give Elon $100/month and he'll give you an API and then you don't need this clunky script. I figured that if he really didn't want people to create this tool, at least he'd added a captcha or some check that a human is logging in in 100 ms, so he probably doesn't care as long as it's not very disrupting.
