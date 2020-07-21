const fs = require("fs");
const crypto = require("crypto");
const puppeteer = require("puppeteer");

const wdirectory = "./Wasm/";
const fdirectory = "./FailList/";
const sdirectory = "./Screenshot/";
const wrapper = fs.readFileSync("./wrapper.js", "utf8");

const sitelist = fs.readFileSync("site4000.txt");
lineArray = sitelist.toString().split('\r\n');

function wasmFound(data, slink) {
    // Use hash as filename for deduplication
    const filename = crypto.createHash("md5").update(data).digest("hex");
    fs.writeFileSync(wdirectory + filename, Buffer.from(data, "base64"));
	console.log("WASM Found!");
	// Record the information about the site, and the module has been discovered
	fs.appendFile(wdirectory + "WasmSiteList.txt", '\ufeff' + slink + ' ' + filename + '\r\n', function (err) {
		if (err) {
			throw err;
		}
	});
}

(async () => {
    if (!fs.existsSync(wdirectory)){
        fs.mkdirSync(wdirectory);
    }
	
	if (!fs.existsSync(fdirectory)){
        fs.mkdirSync(fdirectory);
    }
	
	if (!fs.existsSync(sdirectory)){
        fs.mkdirSync(sdirectory);
    }
	
	var prot = "http://"
	
	for (var i = 0; i < 4000; i++) {
		const browser = await puppeteer.launch();
		try {
			var slink = lineArray[i];
			
			const page = await browser.newPage();
			await page.exposeFunction("wasmFound", source => wasmFound(source, slink));
			await page.evaluateOnNewDocument(wrapper);
			
			// Add http:// in front of URL, cuz puppeteer generates error otherwise	
			await page.goto(prot + slink);
			
			// Wait a bit (30 seconds), to make sure the Wasm as chance to load
			await new Promise(done => setTimeout(done, 30000));
			
			// Take a screenshot of the page
			var ppath = sdirectory + 'Screenshot' + i + '.png';
			await page.screenshot({path: ppath});
			
			// Close the page and browser instance
			await page.close();
			await browser.close();
		}
		catch (e) {
			console.log(e.message);
			// Record the information about the site, and generated error
			fs.appendFile(fdirectory + "FailSiteList.txt", '\ufeff' + slink + '\r\n', function (err) {
				if (err) {
					throw err;
				}
			});
			await browser.close();

		}
		finally {
			
			// Show current progress on the console
			console.log(i, slink);
			await browser.close();
		}
	}
	
	
})();
