import { isTouchDevice } from '../azdom.js';

export class DoubleClick {

   static id = 'azui-doubleclick';
   static settings = {
      delay: 500,
      onDoubleClick: function (e) {
         // console.log(e);
      }
   };

   init() {
      const me = this;
      const settings = me.settings;

      if (isTouchDevice()) {
         let touchtime = 0;
         me.dom.addEventListener('touchstart', function (event) {
            if (touchtime === 0) {
               touchtime = new Date().getTime();
            } else {
               if (new Date().getTime() - touchtime < settings.delay) {
                  settings.onDoubleClick.call(this, event);
                  touchtime = 0;
               } else {
                  touchtime = new Date().getTime();
               }
            }
         });
      }
      me.dom.addEventListener('dblclick', function (event) {
         settings.onDoubleClick.call(this, event);
      });
   }
}
