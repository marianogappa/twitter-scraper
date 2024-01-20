// TODO: read configs from config.json
// TODO: timeout if couldn't find new tweets in 5 secs

const puppeteer = require('puppeteer');

const configs = {
    twitterUsername: process.env.TWITTER_USERNAME,
    twitterPassword: process.env.TWITTER_PASSWORD,
    searchTerms: ['$BTC will'],
    urls: ['https://twitter.com/rovercrc'],
    tweetsPerPage: 5,
    timeoutBetweenTweetsScraped: 5000,
    puppeteerLaunchOptions: { headless: false },
    nextLabel: 'Next',
    loginLabel: 'Log in',
    scrollByPixels: 100,
    scrollCooldownMillis: 100,
}

const urls = [
    ...configs.urls,
    ...configs.searchTerms.map((term) => `https://twitter.com/search?q=${encodeURIComponent(term)}&src=typed_query`),
]

console.log(urls);
if (!configs.twitterUsername || !configs.twitterPassword) {
    throw new Error('Please provide the TWITTER_USERNAME & TWITTER_PASSWORD environment variables; otherwise I cannot scrape!');
}

if (!urls) {
    throw new Error('Please provide either `searchTerms` or `urls` so I have something to scrape!');
}

async function clickElementBySelectorAndText(page, selector, text) {
    await page.evaluate(async (selector, text) => {
        Array.from(document.querySelectorAll(selector)).find(el => el.textContent.trim() === text).click();
    }, selector, text);
}

async function twitterlogIn(page) {
    await page.goto('https://twitter.com/login');
    await page.waitForSelector('input[autocomplete="username"]');
    await page.type('input[autocomplete="username"]', configs.twitterUsername);
    await clickElementBySelectorAndText(page, "div", configs.nextLabel);
    await page.waitForSelector('input[autocomplete="current-password"]');
    await page.type('input[autocomplete="current-password"]', configs.twitterPassword);
    await clickElementBySelectorAndText(page, "div[role='button']", configs.loginLabel);
    await page.waitForSelector('article[data-testid="tweet"]');
}

(async () => {
    const browser = await puppeteer.launch(configs.puppeteerLaunchOptions);
    const page = await browser.newPage();

    // Output console logs on terminal while evaluating in the browser
    page.on('console', (msg) => console.log(msg.text()));

    await twitterlogIn(page);

    const seen = {}

    // Loop over configs.searchTerms
    for (let i = 0; i < urls.length; i++) {
        await page.goto(urls[i]);
        await page.waitForSelector('article[data-testid="tweet"]');

        // Extract tweet data
        await page.evaluate(async (seen, configs) => {
            const curSearchSeen = {};

            while (Object.keys(curSearchSeen).length < configs.tweetsPerPage) {
                document.querySelectorAll('article[data-testid="tweet"]').forEach((tweetElement) => {
                    const url = Array.from(tweetElement.querySelectorAll("a")).find(obj => obj.href.includes("/status/")).href;

                    const hasISODateTime = Array.from(tweetElement.querySelectorAll('time')).find(el => el.getAttribute('datetime'));
                    if (!hasISODateTime) {
                        return; // No ISODateTime means it's an ad rather than a tweet
                    }

                    // Only scrape unscraped tweets
                    if (seen[url]) {
                        return;
                    }
                    seen[url] = true;
                    curSearchSeen[url] = true;

                    // Output new tweet
                    console.log(JSON.stringify({
                        url,
                        tweetContent: tweetElement.querySelector('div[dir="auto"]').textContent,
                        tweetAuthor: tweetElement.querySelector('div[data-testid="User-Name"] a').href,
                        tweetISODateTime: tweetElement.querySelector('time').getAttribute('datetime'),
                    }, null, 2));
                })

                // Scroll & wait before scraping again
                window.scrollBy(0, configs.scrollByPixels);
                await new Promise((resolve) => {
                    setTimeout(resolve, configs.scrollCooldownMillis);
                });
            }
        }, seen, configs);
    }

    await browser.close();
})();
