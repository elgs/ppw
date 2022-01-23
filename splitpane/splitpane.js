import { Resizable } from '../resizable/resizable.js';
import '../_core/core.js';
import { children, getHeight, getWidth, isTouchDevice } from '../_core/lib.js';

export class SplitPane {
   static id = 'azui-splitpane';
   static settings = {
      direction: 'v', // v for vertical or h for horizonal
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

      const handleSize = isTouchDevice() ? 8 : 4;

      const parts = dom.children.length;
      const partSizePercent = 100.0 / parts;

      // const colors = ['red', 'green', 'blue'];
      let selfSize;
      let nextSize;

      const handleBorder = me.settings.direction === 'v' ? 's' : 'e';

      const wrappers = [...dom.children].map(function (child, index) {
         const childWrapper = document.createElement('div');

         az.ui(Resizable, childWrapper, {
            handles: index < parts - 1 ? handleBorder : '',
            handleSize,
            hideCollapseButton: true,
            create: function (e, h) {
               if (settings.create(me, e) === false) {
                  return false;
               }
               const nextWrapper = wrappers[index + 1];
               if (settings.direction === 'v') {
                  selfSize = getHeight(childWrapper);
                  nextSize = getHeight(nextWrapper) + (index === parts - 2 ? handleSize : 0);
               } else {
                  selfSize = getWidth(childWrapper);
                  nextSize = getWidth(nextWrapper) + (index === parts - 2 ? handleSize : 0);
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
               const nextResizable = wrappers[index + 1][Resizable.id];
               if (settings.direction === 'v') {
                  by.dy = Math.max(by.dy, -selfSize);
                  by.dy = Math.min(by.dy, nextSize);
                  nextResizable.moveN(by.dy);
               } else {
                  by.dx = Math.max(by.dx, -selfSize);
                  by.dx = Math.min(by.dx, nextSize);
                  nextResizable.moveW(by.dx);
               }
            },
            stop: function (e) {
               if (settings.stop(me, e) === false) {
                  return false;
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
         childWrapper.style.position = 'absolute';
         if (me.settings.direction === 'v') {
            childWrapper.style['padding-bottom'] = handleSize + 'px';
            childWrapper.style.top = partSizePercent * index + '%';
            childWrapper.style.height = partSizePercent + '%';
            childWrapper.style.width = '100%';
         } else {
            childWrapper.style['padding-right'] = handleSize + 'px';
            childWrapper.style.left = partSizePercent * index + '%';
            childWrapper.style.width = partSizePercent + '%';
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
