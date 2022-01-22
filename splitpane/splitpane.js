import { Resizable } from '../resizable/resizable.js';
import '../_core/core.js';
import { children, getHeight, getWidth, isTouchDevice } from '../_core/lib.js';

export class SplitPane {
   static id = 'azui-splitpane';
   static settings = {
      direction: 'v', // v for vertical or h for horizonal
      // hideCollapseButton: true
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
               const nextWrapper = wrappers[index + 1];
               if (settings.direction === 'v') {
                  selfSize = getHeight(childWrapper) - handleSize;
                  nextSize = getHeight(nextWrapper) - (index === parts - 2 ? 0 : handleSize);
               } else {
                  selfSize = getWidth(childWrapper) - handleSize;
                  nextSize = getWidth(nextWrapper) - (index === parts - 2 ? 0 : handleSize);
               }
               const nextResizable = nextWrapper[Resizable.id];
               nextResizable.setup();
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = 'none');
               });
            },
            resize: function (e, h, by) {
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
            stop: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            },
            collapse: function (e, el) {
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = '');
               });
            }
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
         childWrapper.style.overflow = 'auto';
         me.dom.appendChild(childWrapper);
         childWrapper.appendChild(child);
         // console.log(childWrapper);
         return childWrapper;
      });


   }
}
