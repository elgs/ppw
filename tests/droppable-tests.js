const puppeteer = require('puppeteer');
const liveServer = require("live-server");

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

const port = 2000 + Math.floor(Math.random() * Math.floor(1000));
liveServer.start({
   port,
   open: false,
});

const baseUrl = 'http://127.0.0.1:' + port;

let browser, page;

const getText = async (page, selector) => await page.evaluate(selector => document.querySelector(selector).textContent.trim(), selector);

const gap = 140;
const sourceSize = 100;
const smallTargetSize = 70;
const largeTargetSize = 130;

describe('droppable tests', () => {
   beforeEach(async () => {
      browser = await puppeteer.launch();
      page = await browser.newPage();
      page.on('pageerror', err => {
         fail(err);
      });
      // page.on('console', msg => {
      //   console.log(msg.location());
      //   console.log(msg.type() + ': ' + msg.text());
      // });
   });
   afterEach(async () => {
      await browser.close();
   });

   it('should drop to small target', async () => {
      await page.goto(baseUrl + '/droppable/droppable.html');
      const el = await page.$('.source');
      const bbox = await el.boundingBox();
      const start = { x: bbox.x + 40, y: bbox.y + 40 }
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();

      expect(await getText(page, '.div-small.target .message')).toBe('');
      expect(await getText(page, '.div-large.target .message')).toBe('');

      await page.mouse.move(start.x + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap - 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('touch_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize / 2 - 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('touch_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize / 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('touch_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize / 2 + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_center_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + sourceSize / 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_center_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + sourceSize / 2 + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('source_center_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + 60, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('source_center_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + 61, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('pointer_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('pointer_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_all_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + sourceSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_all_in');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + sourceSize + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_all_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize + sourceSize / 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_all_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize + sourceSize / 2 + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('source_center_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize + 60, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('pointer_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize / 2 + sourceSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('pointer_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize / 2 + sourceSize + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_center_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize + sourceSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('target_center_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap + smallTargetSize + sourceSize + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('touch_out');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.up();
      expect(await getText(page, '.div-small.target .message')).toBe('dropped');
      expect(await getText(page, '.div-large.target .message')).toBe('dropped');
   });

   it('should drop to large target', async () => {
      await page.goto(baseUrl + '/droppable/droppable.html');
      const el = await page.$('.source');
      const bbox = await el.boundingBox();
      const start = { x: bbox.x + 40, y: bbox.y + 40 }
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();

      expect(await getText(page, '.div-small.target .message')).toBe('');
      expect(await getText(page, '.div-large.target .message')).toBe('');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize, start.y, { steps: 10 });
      await page.mouse.up();
      await page.mouse.down();

      await page.mouse.move(start.x + gap * 2 + smallTargetSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('dragged');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('touch_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + sourceSize / 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('touch_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + sourceSize / 2 + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_center_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + 60, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_center_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + 61, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('pointer_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize / 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('pointer_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize / 2 + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('target_center_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + sourceSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('target_center_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + sourceSize + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_all_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_all_in');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize + 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_all_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + sourceSize + largeTargetSize / 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_all_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + sourceSize + largeTargetSize / 2 + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('target_center_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize + sourceSize / 2, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('target_center_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize + sourceSize / 2 + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_center_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize + 59, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('source_center_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize + 60, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('pointer_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize + sourceSize, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('pointer_out');

      await page.mouse.move(start.x + gap * 2 + smallTargetSize + largeTargetSize + sourceSize + 1, start.y, { steps: 10 });
      expect(await getText(page, '.div-small.target .message')).toBe('dragged');
      expect(await getText(page, '.div-large.target .message')).toBe('touch_out');

      await page.mouse.up();
      expect(await getText(page, '.div-small.target .message')).toBe('dropped');
      expect(await getText(page, '.div-large.target .message')).toBe('dropped');
   });
});
