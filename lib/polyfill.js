import mpvue from 'mpvue';

const renderSlot = mpvue.prototype._t;

mpvue.prototype._t = function (name, fallback, props, bindObject, ...params) {
  const slots = renderSlot.call(this, name, fallback, props, bindObject, ...params);
  applyMpcomId(props, slots);
  return slots;
}

function applyMpcomId(data, children) {
  if (!data || !data.mpcomid || !(children instanceof Array)) {
    return;
  }
  children.forEach((child) => {
    const attrs = (child.data || {}).attrs;
    const myChildren = child.children || [];
    if (attrs && attrs.mpcomid) {
      attrs.mpcomid = data.mpcomid + '_' + attrs.mpcomid;
    }
    if (myChildren.length > 0) {
      applyMpcomId(data, myChildren);
    }
  })
}