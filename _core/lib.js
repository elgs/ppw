export const resolveDOM = (parent, dom) => {
   dom = resolveFunction(dom);
   if (dom instanceof Node) {
      return dom;
   } else if ((dom instanceof NodeList || Array.isArray(dom)) && dom.length > 0) {
      return dom[0];
   } else if (typeof dom === 'string') {
      return (parent || document).querySelector(dom);
   }
};

export const resolveFunction = (f) => {
   if (typeof f === 'function') {
      return resolveFunction(f());
   } else {
      return f;
   }
};

export const isOutside = function (x, y, bcr) {
   return (
      x <= bcr.left + getDocScrollLeft() ||
      x >= bcr.right + getDocScrollLeft() ||
      y <= bcr.top + getDocScrollTop() ||
      y >= bcr.bottom + getDocScrollTop()
   );
};

export const isOutsideX = function (x, bcr) {
   return x <= bcr.left + getDocScrollLeft() || x >= bcr.right + getDocScrollLeft();
};

export const isOutsideY = function (y, bcr) {
   return y <= bcr.top + getDocScrollTop() || y >= bcr.bottom + getDocScrollTop();
};

export const getPositionState = function (source, target, event) {
   let ret = 0;
   const s = source.getBoundingClientRect();
   const t = target.getBoundingClientRect();

   if (s.bottom > t.top && s.right > t.left && s.top < t.bottom && s.left < t.right) {
      ret += az.dom.dndState.touch;
   }

   const hasTouches = event.touches?.length;
   const pointerX = hasTouches ? event.touches[0].pageX : event.pageX;
   const pointerY = hasTouches ? event.touches[0].pageY : event.pageY;
   if (!isOutside(pointerX, pointerY, t)) {
      ret += az.dom.dndState.pointer;
   }

   if (s.top >= t.top && s.left >= t.left && s.bottom <= t.bottom && s.right <= t.right) {
      ret += az.dom.dndState.source_all;
   }

   if (t.top >= s.top && t.left >= s.left && t.bottom <= s.bottom && t.right <= s.right) {
      ret += az.dom.dndState.target_all;
   }

   const sx = getDocScrollLeft() + s.left + s.width / 2;
   const sy = getDocScrollTop() + s.top + s.height / 2;
   if (!isOutside(sx, sy, t)) {
      ret += az.dom.dndState.source_center;
   }

   const tx = getDocScrollLeft() + t.left + t.width / 2;
   const ty = getDocScrollTop() + t.top + t.height / 2;
   if (!isOutside(tx, ty, s)) {
      ret += az.dom.dndState.target_center;
   }
   return ret;
};

export const swapElement = function (e0, e1) {
   const temp = document.createElement('div');
   insertBefore(temp, e0);
   insertBefore(e0, e1);
   insertBefore(e1, temp);
   temp.remove();
};

export const isTouchDevice = function () {
   // works on most browsers          // works on IE10/11 and Surface
   return 'ontouchstart' in window || navigator.maxTouchPoints;
};

export const getDocHeight = function () {
   return Math.max(
      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
      Math.max(document.body.clientHeight, document.documentElement.clientHeight)
   );
};

export const getDocWidth = function () {
   return Math.max(
      Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
      Math.max(document.body.offsetWidth, document.documentElement.offsetWidth),
      Math.max(document.body.clientWidth, document.documentElement.clientWidth)
   );
};

export const getDocScrollLeft = function () {
   return Math.max(window.pageXOffset, document.documentElement.scrollLeft, document.body.scrollLeft);
};

export const getDocScrollTop = function () {
   return Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop);
};

export const textWidth = function (elem) {
   const s = parseDOMElement(`<span>${elem.innerHTML}</span>`)[0];
   s.style.visibility = 'hidden';
   insertAfter(s, elem);
   const width = getWidth(s);
   s.parentNode.removeChild(s);
   return width;
};

export const elemSize = function (elem) {
   elem.style.visibility = 'hidden';
   document.body.appendChild(elem);
   const width = getWidth(elem);
   const height = getHeight(elem);
   document.body.removeChild(elem);
   elem.style.visibility = '';
   return {
      width,
      height
   };
};

export const parseDOMElement = domstring => {
   return new DOMParser().parseFromString(domstring, 'text/html').body.childNodes;
};

// inner padding to inner padding
export const getWidth = function (el, style) {
   style ??= getComputedStyle(el);
   return el.clientWidth - parseInt(style.paddingLeft) - parseInt(style.paddingRight);
};

export const getHeight = function (el, style) {
   style ??= getComputedStyle(el);
   return el.clientHeight - parseInt(style.paddingTop) - parseInt(style.paddingBottom);
};

// inner padding to inner padding
export const setWidth = function (el, w, style) {
   style ??= getComputedStyle(el);
   if (style['box-sizing'] === 'border-box') {
      const borderLeft = parseInt(style['border-left-width']);
      const borderRight = parseInt(style['border-right-width']);
      const paddingLeft = parseInt(style['padding-left']);
      const paddingRight = parseInt(style['padding-right']);
      el.style.width = w + borderLeft + borderRight + paddingLeft + paddingRight + 'px';
   } else {
      el.style.width = w + 'px';
   }
};

export const setHeight = function (el, h, style) {
   style ??= getComputedStyle(el);
   if (style['box-sizing'] === 'border-box') {
      const borderTop = parseInt(style['border-top-width']);
      const borderBottom = parseInt(style['border-bottom-width']);
      const paddingTop = parseInt(style['padding-top']);
      const paddingBottom = parseInt(style['padding-bottom']);
      // console.log(h, borderTop, borderBottom, paddingTop, paddingBottom);
      el.style.height = h + borderTop + borderBottom + paddingTop + paddingBottom + 'px';
   } else {
      el.style.height = h + 'px';
   }
};

// outer border to ourter border
export const setOuterBorderWidth = function (el, w, style) {
   style ??= getComputedStyle(el);
   if (style['box-sizing'] === 'border-box') {
      el.style.width = w + 'px';
   } else {
      const borderLeft = parseInt(style['border-left-width']);
      const borderRight = parseInt(style['border-right-width']);
      const paddingLeft = parseInt(style['padding-left']);
      const paddingRight = parseInt(style['padding-right']);
      el.style.width = w - borderLeft - borderRight - paddingLeft - paddingRight + 'px';
   }
};

export const setOuterBorderHeight = function (el, h, style) {
   style ??= getComputedStyle(el);
   if (style['box-sizing'] === 'border-box') {
      el.style.height = h + 'px';
   } else {
      const borderTop = parseInt(style['border-top-width']);
      const borderBottom = parseInt(style['border-bottom-width']);
      const paddingTop = parseInt(style['padding-top']);
      const paddingBottom = parseInt(style['padding-bottom']);
      el.style.height = h - borderTop - borderBottom - paddingTop - paddingBottom + 'px';
   }
};

export const insertAfter = function (newNode, referenceNode) {
   if (referenceNode.nextElementSibling) {
      // console.log(referenceNode, referenceNode.nextElementSibling);
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextElementSibling);
   } else {
      referenceNode.parentNode.appendChild(newNode);
   }
};

export const insertBefore = function (newNode, referenceNode) {
   referenceNode.parentNode.insertBefore(newNode, referenceNode);
};

export const siblings = function (el, selector) {
   if (selector) {
      return Array.prototype.filter.call(el.parentNode.children, function (child) {
         return matches(child, selector) && child !== el;
      });
   } else {
      return Array.prototype.filter.call(el.parentNode.children, function (child) {
         return child !== el;
      });
   }
};

export const children = function (el, selector) {
   if (selector) {
      return Array.prototype.filter.call(el.children, function (child) {
         return matches(child, selector) && child !== el;
      });
   } else {
      return Array.prototype.filter.call(el.children, function (child) {
         return child !== el;
      });
   }
};

export const index = function (node, selector) {
   let children = node.parentNode.children;
   if (selector) {
      children = Array.prototype.filter.call(children, function (child) {
         return matches(child, selector);
      });
   }
   return Array.prototype.indexOf.call(children, node);
};

export const matches = function (el, selector) {
   return (
      el.matches ||
      el.matchesSelector ||
      el.msMatchesSelector ||
      el.mozMatchesSelector ||
      el.webkitMatchesSelector ||
      el.oMatchesSelector
   ).call(el, selector);
};

export const position = function (el) {
   const elStyles = getComputedStyle(el);
   const marginTop = parseInt(elStyles['margin-top']);
   const marginLeft = parseInt(elStyles['margin-left']);

   const elpStyles = getComputedStyle(el.parentNode);
   const pBorderTop = parseInt(elpStyles['border-top-width']);
   const pBorderLeft = parseInt(elpStyles['border-left-width']);

   const bcr = el.getBoundingClientRect();
   const pbcr = el.parentNode.getBoundingClientRect();

   const ret = {
      top: bcr.top - pbcr.top - pBorderTop - marginTop,
      left: bcr.left - pbcr.left - pBorderLeft - marginLeft
   };
   return ret;
};

export const diffPosition = function (el0, el1) {
   const bcr0 = el0.getBoundingClientRect();
   const bcr1 = el1.getBoundingClientRect();

   const ret = {
      top: bcr0.top - bcr1.top,
      left: bcr0.left - bcr1.left,
      bottom: bcr0.bottom - bcr1.bottom,
      right: bcr0.right - bcr1.right,
      // reverse
      topR: bcr0.top - bcr1.bottom,
      leftR: bcr0.left - bcr1.right,
      bottomR: bcr0.bottom - bcr1.top,
      rightR: bcr0.right - bcr1.left
   };
   return ret;
};

export const diffPositionInnerBorder = function (el0, el1) {
   const el0Styles = getComputedStyle(el0);
   const el0BorderTop = parseInt(el0Styles['border-top-width']);
   const el0BorderLeft = parseInt(el0Styles['border-left-width']);
   const el0BorderBottom = parseInt(el0Styles['border-bottom-width']);
   const el0BorderRight = parseInt(el0Styles['border-right-width']);

   const el1pStyles = getComputedStyle(el1);
   const el1BorderTop = parseInt(el1pStyles['border-top-width']);
   const el1BorderLeft = parseInt(el1pStyles['border-left-width']);
   const el1BorderBottom = parseInt(el1pStyles['border-bottom-width']);
   const el1BorderRight = parseInt(el1pStyles['border-right-width']);

   const bcr0 = el0.getBoundingClientRect();
   const bcr1 = el1.getBoundingClientRect();

   const ret = {
      top: bcr0.top + el0BorderTop - bcr1.top - el1BorderTop,
      left: bcr0.left + el0BorderLeft - bcr1.left - el1BorderLeft,
      bottom: bcr0.bottom + el0BorderBottom - bcr1.bottom - el1BorderBottom,
      right: bcr0.right + el0BorderRight - bcr1.right - el1BorderRight
   };
   return ret;
};

export const normalizeIcon = function (i) {
   i = resolveFunction(i);
   if (typeof i === 'string') {
      return parseDOMElement(`<span>${i}</span>`)[0];
   } else if (typeof i === 'object') {
      const sp = document.createElement('span');
      sp.appendChild(i);
      return sp;
   }
};

export const ancestors = (el, selector) => {
   const ancestors = [];
   while ((el = el.parentNode)) {
      if (el.nodeType === 1 && (!selector || matches(el, selector))) {
         ancestors.push(el);
      }
   }
   return ancestors;
};

export const nextElem = (el, selector) => {
   while ((el = el.nextSibling)) {
      if (el.nodeType === 1 && (!selector || matches(el, selector))) {
         return el;
      }
   }
};

export const prevElem = (el, selector) => {
   while ((el = el.previousSibling)) {
      if (el.nodeType === 1 && (!selector || matches(el, selector))) {
         return el;
      }
   }
};

export const nextAll = (el, selector) => {
   const siblings = [];
   while ((el = el.nextSibling)) {
      if (el.nodeType === 1 && (!selector || matches(el, selector))) {
         siblings.push(el);
      }
   }
   return siblings;
};

export const prevAll = (el, selector) => {
   const siblings = [];
   while ((el = el.previousSibling)) {
      if (el.nodeType === 1 && (!selector || matches(el, selector))) {
         siblings.push(el);
      }
   }
   return siblings;
};

export const empty = box => {
   while (box.lastChild) {
      box.removeChild(box.lastChild);
   }
};
