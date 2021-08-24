const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
//const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const { log } = require("npm-colorlog");
puppeteer.use(StealthPlugin());
//puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

//true for hidden Chromium
puppeteer.launch({
    headless: true,
    timeout: 120000,
    args: [
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36",
        "--no-sandbox",
        "--disabe-infobars",
        "--disable-setuid-sandbox",
        "--window-position=0,0",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list"
    ],

}).then(async browser => {
    console.log('✷ Running browser..')
    const page = await browser.newPage();
    //    await page.setViewport({ width: 800, height: 600 })

    await page.goto('https://nationsglory.fr/server/yellow/countries')
    await page
        .waitForSelector('.lead')
        .then(() => console.log('load '));
    await page._client.send("Page.stopLoading");
    await page.waitForTimeout(900);

    //await page.waitForTimeout(21000)
    await page.screenshot({ path: 'botTester.png' });


    const hrefs = await page.$$eval("tr > td > a", (list) => list.map((elm) => elm.href));
    const links = [];

    hrefs.forEach(hf => {
        if (hf.startsWith('https://nationsglory.fr/country/yellow/') == true) {
            links.push(hf)
        }
    });
    const linkLength = links.length / 2;
    for (let i = 0; i < linkLength; i++) {
        let pay = links[i].substring(37, links[i].length)

        await page.goto(links[i])
        await page.waitForTimeout(900);
        await page
            .waitForSelector('.section-title')
            .then(() => console.log('load country'));
        page.waitForSelector('#bodymembers>tr>.pl-4 > a > div');

        const claims = await page.evaluate(() => Array.from(document.querySelectorAll(".mb-2"), element => element.textContent));
        const powers = await page.evaluate(() => Array.from(document.querySelectorAll(".col-md-3 > .mb-2"), element => element.textContent));
        const members = await page.evaluate(() => Array.from(document.querySelectorAll("#bodymembers>tr>.pl-4 > a > div"), element => element.textContent));
        const relations = await page.evaluate(() => Array.from(document.querySelectorAll("#bodyrelations>tr"), element => element.textContent));


        let level = claims[2];
        let power = powers[1].split("/");
        let claim = claims[4];
        power = parseInt(power[0], 10)
        claim = parseInt(claim, 10)

        log("n°" + i + pay + " → ♝ level: " + level + " → ♚ power: " + power, " → ♛ claim: " + claim + "\n" + "→ ♟Members: " + members + "\n" + "\n" + "Relations:" + relations, 'red', 'black')
        let countryInfos = ("n°" + i + pay + " → ♝ level: " + level + " → ♚ power: " + power, " → ♛ claim: " + claim + "\n" + "→ ♟Members: " + members + "\n" + "\n" + "Relations:" + relations, 'red', 'black')
        const fs = require('fs');
        fs.writeFile('countryInfos.txt', countryInfos, function(err) {
            if (err) throw err;
            console.log('Fichier créé !');
        });
    }
    await browser.close();
    console.log("✨All done, check the console✨");
})