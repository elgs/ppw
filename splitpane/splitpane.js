import { Resizable } from '../resizable/resizable.js';
import '../_core/core.js';
import { children, getHeight, getWidth, isTouchDevice } from '../_core/lib.js';

export class SplitPane {
   static id = 'azui-splitpane';
   static settings = {
      direction: 'v', // v for vertical or h for horizonal
      hideCollapseButton: true
   };

   init() {
      const dom = this.dom;
      const me = this;
      const settings = this.settings;
      dom.style.position = 'relative';

      const handleSize = isTouchDevice() ? 8 : 4;

      const parts = dom.children.length;
      const partSizePercent = 100.0 / parts;

      const colors = ['red', 'green', 'blue'];

      const wrappers = [...dom.children].map(function (child, index) {
         const childWrapper = document.createElement('div');

         az.ui(Resizable, childWrapper, {
            handles: index < parts - 1 ? 's' : '',
            handleSize,
            hideCollapseButton: settings.hideCollapseButton,
            create: function (e, h) {
               // centerHeight = getHeight(me.center);
               const nextResizable = wrappers[index + 1][Resizable.id];
               nextResizable.setup();
               dom.querySelectorAll('iframe').forEach(iframe => {
                  iframe && (iframe.style['pointer-events'] = 'none');
               });
            },
            resize: function (e, h, by) {
               // by.dy = Math.min(by.dy, centerHeight);
               const nextResizable = wrappers[index + 1][Resizable.id];
               nextResizable.moveN(by.dy);
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
         childWrapper.classList.add('azSplitPane');
         childWrapper.style['background-color'] = colors[index % colors.length];
         childWrapper.style.position = 'absolute';
         childWrapper.style.top = partSizePercent * index + '%';
         // childWrapper.style.bottom = (100 - partSize * (index + 1)) + '%';
         childWrapper.style.height = partSizePercent + '%';
         childWrapper.style.overflow = 'auto';
         me.dom.appendChild(childWrapper);
         childWrapper.appendChild(child);
         // console.log(childWrapper);
         return childWrapper;
      });


   }
}
