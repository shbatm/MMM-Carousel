import {after, before, test} from "node:test";
import {dirname, resolve} from "node:path";
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const mirrorRoot = resolve(testDirectory, "../../../..");
const carouselRoot = resolve(testDirectory, "../..");
const coreStyles = readFileSync(resolve(mirrorRoot, "css/main.css"), "utf8");
const carouselStyles = readFileSync(resolve(carouselRoot, "MMM-Carousel.css"), "utf8");
const carouselSource = readFileSync(resolve(carouselRoot, "MMM-Carousel.js"), "utf8");

let browser = null;

before(async () => {
  browser = await chromium.launch({headless: true});
});

after(async () => {
  await browser?.close();
});

const getLayout = (page) => page.evaluate(() => ({
  clockTop: document.getElementById("clock").getBoundingClientRect().top,
  bodyHeight: Number.parseFloat(getComputedStyle(document.body).height),
  bottomRegionOffset: Number.parseFloat(getComputedStyle(document.getElementById("bottom-region")).bottom)
}));

const setupPage = async () => {
  const page = await browser.newPage({viewport: {width: 1280,
    height: 800}});
  await page.setContent(`
    <html>
      <body>
        <div class="region top left">
          <div class="container">
            <div id="clock" class="module clock">
              <header class="module-header" style="display: none"></header>
              <div class="module-content">Clock</div>
            </div>
          </div>
        </div>
        <div id="bottom-region" class="region bottom">
          <div class="container"></div>
        </div>
      </body>
    </html>
  `);
  await page.addStyleTag({content: coreStyles});
  const coreLayout = await getLayout(page);
  await page.addStyleTag({content: carouselStyles});
  await page.addScriptTag({
    content: "window.Module = {register(name, definition) {window.carouselDefinition = definition;}};"
  });
  await page.addScriptTag({content: carouselSource});

  return {page,
    coreLayout};
};

const appendCarousel = (page, {id, config, targetSelector, beforeSelector = null}) => page.evaluate((options) => {
  const content = window.carouselDefinition.getDom.call({
    config: options.config,
    makeOnChangeHandler: () => () => null
  });
  const carousel = document.createElement("div");
  carousel.id = options.id;
  carousel.className = "module MMM-Carousel";
  const moduleContent = document.createElement("div");
  moduleContent.className = "module-content";
  moduleContent.appendChild(content);
  carousel.appendChild(moduleContent);

  const target = document.querySelector(options.targetSelector);
  if (options.beforeSelector) {
    target.insertBefore(carousel, document.querySelector(options.beforeSelector));
  } else {
    target.appendChild(carousel);
  }
}, {id,
  config,
  targetSelector,
  beforeSelector}).then(() => getLayout(page));

const getLayoutDelta = (initialLayout, currentLayout) => ({
  clockTopDelta: currentLayout.clockTop - initialLayout.clockTop,
  bodyHeightDelta: currentLayout.bodyHeight - initialLayout.bodyHeight,
  bottomRegionOffsetDelta: currentLayout.bottomRegionOffset - initialLayout.bottomRegionOffset
});

test("only visible Carousel controls change the mirror layout", async () => {
  const {page, coreLayout} = await setupPage();

  try {
    const layoutWithoutControls = await appendCarousel(page, {
      id: "carousel-empty",
      config: {
        mode: "positional",
        showPageIndicators: false,
        showPageControls: false
      },
      targetSelector: ".region.top.left .container",
      beforeSelector: "#clock"
    });

    assert.deepEqual(
      getLayoutDelta(coreLayout, layoutWithoutControls),
      {clockTopDelta: 0,
        bodyHeightDelta: 0,
        bottomRegionOffsetDelta: 0},
      "a Carousel with hidden controls should not change the mirror layout"
    );

    await page.locator("#carousel-empty").evaluate((element) => element.remove());
    const layoutWithControls = await appendCarousel(page, {
      id: "carousel-controls",
      config: {
        mode: "slides",
        showPageIndicators: true,
        showPageControls: false,
        slides: {first: [],
          second: []}
      },
      targetSelector: "#bottom-region .container"
    });

    assert.equal(layoutWithControls.bodyHeight - coreLayout.bodyHeight, 60);
    assert.equal(layoutWithControls.bottomRegionOffset, 60);
  } finally {
    await page.close();
  }
});
