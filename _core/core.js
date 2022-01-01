import { resolveDOM } from './lib.js';

globalThis.az = globalThis.az ?? {};

globalThis.az = {
   dom: {
      dndState: {
         touch: 1 << 0,
         pointer: 1 << 1,
         source_all: 1 << 2,
         target_all: 1 << 3,
         source_center: 1 << 4,
         target_center: 1 << 5
      },
      dndEvent: {
         touch_in: 1 << 0,
         pointer_in: 1 << 1,
         source_all_in: 1 << 2,
         target_all_in: 1 << 3,
         source_center_in: 1 << 4,
         target_center_in: 1 << 5,
         touch_out: 1 << 6,
         pointer_out: 1 << 7,
         source_all_out: 1 << 8,
         target_all_out: 1 << 9,
         source_center_out: 1 << 10,
         target_center_out: 1 << 11,
         dragged: 1 << 12,
         dropped: 1 << 13,
         all: (1 << 14) - 1,
         none: 0
      },
   },
   cursor: {
      x: undefined,
      y: undefined
   },
};

let domId = 0;

// dom holds component object in [class id]
globalThis.az.ui = (componentClass, domElement, options, parent = null) => {
   const dom = resolveDOM(parent, domElement);
   let componentObject = dom[componentClass.id];
   if (componentObject) {
      return componentObject;
   }

   componentObject = new componentClass();
   dom[componentClass.id] = componentObject;
   dom.classList.add('azui', componentClass.id);
   dom.setAttribute(componentClass.id, domId++);
   componentObject.dom = dom;
   componentObject.settings = { ...componentClass.settings, ...options };
   componentObject.init?.call(componentObject);
   return componentObject;
};
