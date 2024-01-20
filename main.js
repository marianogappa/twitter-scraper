// TODO: read configs from config.json
// TODO: timeout if couldn't find new tweets in 5 secs
// TODO: support both search terms or user's profiles
// TODO: wait for selector rather than network idle
// TODO: clean up, comment
// TODO: tweetISODateTime doesn't work. Fix it.

const puppeteer = require('puppeteer');

const configs = {
    twitterUsername: process.env.TWITTER_USERNAME,
    twitterPassword: process.env.TWITTER_PASSWORD,
    searchTerms: ['$BTC will'],
    tweetsPerPage: 10,
    timeoutBetweenTweetsScraped: 5000,
    puppeteerLaunchOptions: { headless: false },
    nextLabel: 'Next',
    loginLabel: 'Log in',
}

// A node function that accepts a selector and a string, and returns the first dom element satisfying the selector, but also whose content is exactly that string.
async function clickElementBySelectorAndText(page, selector, text) {
    await page.evaluate(async (selector, text) => {
        Array.from(document.querySelectorAll(selector)).find(el => el.textContent.trim() === text).click();
    }, selector, text);
}

async function twitterlogIn(page) {
    // Navigate to Twitter login page
    await page.goto('https://twitter.com/login');

    // Fill in login credentials and submit the form
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
    page.on('console', (msg) => console.log(msg.text()));

    await twitterlogIn(page);

    const seen = {}

    // Loop over configs.searchTerms
    for (let i = 0; i < configs.searchTerms.length; i++) {
        const searchTerm = configs.searchTerms[i];
        await page.goto(`https://twitter.com/search?q=${encodeURIComponent(searchTerm)}&src=typed_query`);
        await page.waitForSelector('article[data-testid="tweet"]');

        // Extract tweet data
        await page.evaluate(async (seen, configs) => {
            const curSearchSeen = {};

            while (Object.keys(curSearchSeen).length <= 10) {
                document.querySelectorAll('article[data-testid="tweet"]').forEach((tweetElement) => {
                    const url = Array.from(tweetElement.querySelectorAll("a")).find(obj => obj.href.includes("/status/")).href

                    if (seen[url]) {
                        return;
                    }

                    seen[url] = true;
                    curSearchSeen[url] = true;

                    const tweetContent = tweetElement.querySelector('div[dir="auto"]').textContent;
                    const tweetAuthor = tweetElement.querySelector('div[data-testid="User-Name"] a').href;
                    const tweetISODateTime = tweetElement.querySelector('time').datetime;

                    console.log(JSON.stringify({
                        url,
                        tweetContent,
                        tweetAuthor,
                        tweetISODateTime
                    }, null, 2));
                })

                window.scrollBy(0, 100);
                await new Promise((resolve) => {
                    setTimeout(resolve, 100);
                });
            }
        }, seen, configs);
    }

    // Close the browser
    await browser.close();
})();
