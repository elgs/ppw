import { isTouchDevice } from '../azdom.js';


export class RightClick {
   static id = 'azui-rightclick';
   static settings = {
      onRightClick: function (e) { },
      preventDefault: true,
   };

   init() {

      const me = this;
      const dom = me.dom;
      const settings = me.settings;

      const onTouchEnd = me._onTouchEnd.bind(me);

      dom.setAttribute('tabindex', 0);
      dom.style.outline = 'none';

      dom.addEventListener('contextmenu', settings.onRightClick);

      if (isTouchDevice()) {
         dom.addEventListener('touchstart', function (event) {
            dom.removeEventListener('touchend', onTouchEnd);
            dom.addEventListener('touchend', onTouchEnd);
            me._timer = setTimeout(function () {
               if (dom === document || dom === window || dom.parentNode) {
                  me.triggered = true;
                  settings.onRightClick(event);
               }
            }, 500);
            // console.log(settings.preventDefault(event));
            if (settings.preventDefault) {
               event.preventDefault(); // prevent long press browser menu;
            }
         });
      }
   }

   _onTouchEnd(event) {
      if (this.triggered) {
         this.triggered = false;
      } else {
         clearTimeout(this._timer);
         event.target.dispatchEvent(new CustomEvent('click'));
      }
   }
}
