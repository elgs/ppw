import { dndEvent, dndState } from '../../azdom/utils.js';

export class Droppable {

   constructor() {
      const me = this;

      const attachEvent = eventName => {
         me[eventName] = event => {
            me.settings?.[eventName]?.call?.(me, event);
         };
      };

      Object.keys(dndState).map(state => {
         const stateIn = state + '_in';
         const stateOut = state + '_out';
         attachEvent(stateIn);
         attachEvent(stateOut);
      });
      attachEvent('dragged');
      attachEvent('dropped');
   }

   azInit(options) {
      const settings = {
         // source_all_in: function (e) {},
         // source_all_out: function (e) {},
         // target_all_in: function (e) {},
         // target_all_out: function (e) {},
         // source_center_in: function (e) {},
         // source_center_out: function (e) {},
         // target_center_in: function (e) {},
         // target_center_out: function (e) {},
         // touch_in: function (e) {},
         // touch_out: function (e) {},
         // pointer_in: function (e) {},
         // pointer_out: function (e) {},
         // dragged: function (e) {},
         // dropped: function (e) {},
         interestedDropEvents: dndEvent.all,
         ...options
      };


      const me = this;
      const node = me.node;
      me.settings = settings;

      node.setAttribute('az-interested-drop-events', settings.interestedDropEvents);

      const addEventListener = eventName => {
         if (settings[eventName]) {
            me.node.addEventListener(eventName, me[eventName]);
         }
      };

      Object.keys(dndState).map(state => {
         const stateIn = state + '_in';
         const stateOut = state + '_out';
         addEventListener(stateIn);
         addEventListener(stateOut);
      });
      addEventListener('dragged');
      addEventListener('dropped');
   }
}
