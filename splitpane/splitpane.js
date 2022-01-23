import { Resizable } from '../resizable/resizable.js';
import '../_core/core.js';
import { children, getHeight, getWidth, isTouchDevice } from '../_core/lib.js';

export class SplitPane {
   static id = 'azui-splitpane';
   static settings = {
      direction: 'v', // v for vertical or h for horizonal
      paneSizes: [],
      // hideCollapseButton: true,
      create: function (event) {
         // console.log('create');
      },
      start: function (event) {
         // console.log('start');
      },
      resize: function (event, handle, by) {
         // console.log('resize', handle, by);
      },
      stop: function (event) {
         // console.log('stop');
      },
   };

   init() {
      const dom = this.dom;
      const me = this;
      const settings = this.settings;
      dom.style.position = 'relative';
      dom.style.display = 'flex';
      dom.style['flex-direction'] = me.settings.direction === 'v' ? 'column' : 'row';

      const handleSize = isTouchDevice() ? 8 : 4;

      const parts = dom.children.length;
      if (parts !== settings.paneSizes.length) {
         settings.paneSizes.length = parts;
         settings.paneSizes.fill(100.0 / parts);
      }

      // const colors = ['red', 'green', 'blue'];
      let selfSize;
      let nextSize;
      let nextWrapper;

      const handleBorder = me.settings.direction === 'v' ? 's' : 'e';

      const wrappers = [...dom.children].map(function (child, index) {
         const childWrapper = document.createElement('div');

         az.ui(Resizable, childWrapper, {
            handles: index <= parts - 2 ? handleBorder : '',
            handleSize,
            hideCollapseButton: true,
            create: function (e) {
               if (settings.create(me, e) === false) {
                  return false;
               }
               nextWrapper = wrappers[index + 1];
               if (settings.direction === 'v') {
                  selfSize = getHeight(childWrapper);
                  nextSize = getHeight(nextWrapper);
               } else {
                  selfSize = getWidth(childWrapper);
                  nextSize = getWidth(nextWrapper);
               }
               const nextResizable = nextWrapper[Resizable.id];
               nextResizable.setup();
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = 'none');
               });
            },
            resize: function (e, h, by) {
               if (settings.resize(me, e, h, by) === false) {
                  return false;
               }
               const nextResizable = nextWrapper[Resizable.id];
               if (settings.direction === 'v') {
                  by.dy = Math.max(by.dy, -selfSize);
                  by.dy = Math.min(by.dy, nextSize);
                  nextResizable.moveS(-by.dy);
               } else {
                  by.dx = Math.max(by.dx, -selfSize);
                  by.dx = Math.min(by.dx, nextSize);
                  nextResizable.moveE(-by.dx);
               }
            },
            stop: function (e) {
               if (settings.stop(me, e) === false) {
                  return false;
               }
               if (me.settings.direction === 'v') {
                  childWrapper.style.height = childWrapper.offsetHeight * 100 / dom.offsetHeight + '%';
                  nextWrapper.style.height = nextWrapper.offsetHeight * 100 / dom.offsetHeight + '%';
               } else {
                  childWrapper.style.width = childWrapper.offsetWidth * 100 / dom.offsetWidth + '%';
                  nextWrapper.style.width = nextWrapper.offsetWidth * 100 / dom.offsetWidth + '%';
               }
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            },
            // collapse: function (e, el) {
            //    dom.querySelectorAll('iframe').forEach(iframe => {
            //       iframe && (iframe.style['pointer-events'] = '');
            //    });
            // }
         });
         // childWrapper.classList.add('azSplitPane');
         // childWrapper.style['background-color'] = colors[index % colors.length];
         if (me.settings.direction === 'v') {
            childWrapper.style['padding-bottom'] = (index <= parts - 2 ? handleSize : 0) + 'px';
            childWrapper.style.height = settings.paneSizes[index] + '%';
            childWrapper.style.width = '100%';
         } else {
            childWrapper.style['padding-right'] = (index <= parts - 2 ? handleSize : 0) + 'px';
            childWrapper.style.width = settings.paneSizes[index] + '%';
            childWrapper.style.height = '100%';
         }
         childWrapper.style.overflow = 'hidden';
         me.dom.appendChild(childWrapper);
         childWrapper.appendChild(child);
         // console.log(childWrapper);
         return childWrapper;
      });


   }
}
