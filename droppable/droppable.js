import '../azdom.js';

export class Droppable {
   static id = 'azui-droppable';
   static settings = {
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
   };

   init() {
      const me = this;
      this.dom.setAttribute('az-interested-drop-events', this.settings.interestedDropEvents);

      const addEvent = eventName => {
         if (me.settings[eventName]) {
            me.dom.addEventListener(eventName, me.settings[eventName]?.bind(me));
         }
      };

      Object.keys(az.dom.dndState).map(state => {
         const stateIn = state + '_in';
         const stateOut = state + '_out';
         addEvent(stateIn);
         addEvent(stateOut);
      });
      addEvent('dragged');
      addEvent('dropped');
   }
}
