const puppeteer = require('puppeteer');
const liveServer = require("live-server");

const port = 2000 + Math.floor(Math.random() * Math.floor(1000));
liveServer.start({
   port,
   open: false,
});

const baseUrl = 'http://127.0.0.1:' + port;

let browser, page;

// const getComputedStyle = selector => {
//   const el = document.querySelector(selector);
//   const styles = getComputedStyle(el);
//   return JSON.parse(JSON.stringify(styles));
// };

const dragTest = async (selector, mouseCursorOffset, moveOffset, endOffset = moveOffset) => {
   const el = await page.$(selector);
   const start = await el.boundingBox();
   const mouseCursor = { x: start.x + mouseCursorOffset.x, y: start.y + mouseCursorOffset.y };

   await page.mouse.move(mouseCursor.x, mouseCursor.y);
   await page.mouse.down();
   const steps = Math.max(Math.abs(moveOffset.x), Math.abs(moveOffset.y));
   await page.mouse.move(mouseCursor.x + moveOffset.x, mouseCursor.y + moveOffset.y, { steps });
   await page.mouse.up();

   const end = await el.boundingBox();

   expect(end.x).toEqual(start.x + endOffset.x);
   expect(end.y).toEqual(start.y + endOffset.y);
};

// (async () => {
//   const boxDistance = 20; // each has 10 margin
//   const snapDistance = 8;
//   const snapGap = 1;
//   browser = await puppeteer.launch({ headless: false });
//   page = await browser.newPage();
//   page.on('console', msg => {
//     console.log(msg.text());
//   });
//   await page.goto(baseUrl + '/draggable/draggable-snap.html');
//   // await dragTest('.draggable.x', { x: 10, y: 30 }, { x: boxDistance - snapGap - 1, y: 30 });
// })();
// return;

describe('draggable tests', () => {
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

   it('should drag', async () => {
      await page.goto(baseUrl + '/draggable/draggable-basic.html');
      await dragTest('.draggable', { x: 10, y: 30 }, { x: 20, y: 30 });
   });

   it('should drag only on handle', async () => {
      await page.goto(baseUrl + '/draggable/draggable-handle.html');
      // drag draggable, not handle
      await dragTest('.draggable', { x: 10, y: 30 }, { x: 20, y: 30 }, { x: 0, y: 0 });
      // drag handle
      await dragTest('.draggable-handle', { x: 10, y: 10 }, { x: 20, y: 30 });
   });

   it('should drag on x or y axis', async () => {
      await page.goto(baseUrl + '/draggable/draggable-axis.html');
      // drag along x axis
      await dragTest('.draggable.x', { x: 10, y: 30 }, { x: 20, y: 30 }, { x: 20, y: 0 });
      // drag along y axis
      await dragTest('.draggable.y', { x: 10, y: 10 }, { x: 20, y: 30 }, { x: 0, y: 30 });
   });

   describe('container tests', () => {
      beforeEach(async () => {
         await page.goto(baseUrl + '/draggable/draggable-container.html');
      });

      it('should drag inside container', async () => {
         await dragTest('.draggable', { x: 10, y: 30 }, { x: 20, y: 30 }, { x: 20, y: 30 });
      });

      it('should drag to container bottom', async () => {
         const containerInnerHeight = 300 - 2; // 1px border on each side
         await dragTest('.draggable', { x: 10, y: 30 }, { x: 20, y: containerInnerHeight - 100 });
      });

      it('should drag to but not beyond container bottom', async () => {
         const containerInnerHeight = 300 - 2; // 1px border on each side
         await dragTest('.draggable', { x: 10, y: 30 }, { x: 20, y: containerInnerHeight - 100 + 1 }, { x: 20, y: containerInnerHeight - 100 });
      });

      it('should drag to container right', async () => {
         const containerInnerWidth = 300 - 2; // 1px border on each side
         await dragTest('.draggable', { x: 10, y: 30 }, { x: containerInnerWidth - 100, y: 30 });
      });

      it('should drag to but not beyond container right', async () => {
         const containerInnerWidth = 300 - 2; // 1px border on each side
         await dragTest('.draggable', { x: 10, y: 30 }, { x: containerInnerWidth - 100 + 1, y: 30 }, { x: containerInnerWidth - 100, y: 30 });
      });
   });


   describe('snap tests', () => {
      const boxDistance = 20; // each has 10 margin
      const snapDistance = 8;
      const snapGap = 1;

      beforeEach(async () => {
         await page.goto(baseUrl + '/draggable/draggable-snap.html');
      });

      it('should drag and snap to siblings', async () => {
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: boxDistance - snapGap - 1, y: 30 });
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: 1, y: 0 });
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: 1, y: 0 }, { x: 0, y: 0 }); // snapped
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: snapDistance, y: 0 }, { x: 0, y: 0 }); // snapped
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: -snapDistance, y: 0 }, { x: 0, y: 0 }); // snapped
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: -snapDistance - 1, y: 0 }, { x: -1, y: 0 }); //detached
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: 1, y: 0 }, { x: 1, y: 0 }); //touched
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: snapDistance, y: 0 }, { x: 0, y: 0 }); // snapped
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: snapDistance + 1, y: 0 }, { x: 1, y: 0 }); // detached
      });

      it('should drag and snap to parent', async () => {
         const el = await page.$('.draggable.x');
         const box = await el.boundingBox();
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: -box.x, y: 30 });
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: - 1, y: 0 }, { x: 0, y: 0 });
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: - snapDistance, y: 0 }, { x: 0, y: 0 });
         await dragTest('.draggable.x', { x: 10, y: 30 }, { x: - snapDistance - 1, y: 0 }, { x: -1, y: 0 });
      });
   });
});