import '../azdom.js';

export class Droppable {
   static id = 'azui-droppable';
   constructor(dom, options) {
      const me = this;

      const attachEvent = eventName => {
         me[eventName] = event => {
            me.settings?.[eventName]?.call?.(me, event);
         };
      };

      Object.keys(az.dom.dndState).map(state => {
         const stateIn = state + '_in';
         const stateOut = state + '_out';
         attachEvent(stateIn);
         attachEvent(stateOut);
      });
      attachEvent('dragged');
      attachEvent('dropped');

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
         interestedDropEvents: az.dom.dndEvent.all,
         ...options
      };


      me.dom = dom;
      me.settings = settings;

      dom.setAttribute('az-interested-drop-events', settings.interestedDropEvents);

      const addEventListener = eventName => {
         if (settings[eventName]) {
            me.dom.addEventListener(eventName, me[eventName]);
         }
      };

      Object.keys(az.dom.dndState).map(state => {
         const stateIn = state + '_in';
         const stateOut = state + '_out';
         addEventListener(stateIn);
         addEventListener(stateOut);
      });
      addEventListener('dragged');
      addEventListener('dropped');
   }
}
