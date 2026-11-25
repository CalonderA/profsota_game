'use strict';

// Pure network rules, shared by the SVG game and its tests.
class KskNetwork {
  constructor() {
    this.placed = {};
    this.links = [];
    this.serial = 0;
    this.fixed = ['internet', 'dev1', 'dev2', 'design1', 'design2', 'printer'];
  }
  ports(device) {
    if (!this.fixed.includes(device) && !this.placed[device]) return [];
    return device === 'router' ? ['wan', 'lan'] : device === 'switch' ? Array.from({length:8}, (_, i) => String(i+1)) : ['net'];
  }
  place(device, slot) {
    if (this.placed[device] || Object.values(this.placed).includes(slot)) return false;
    if (!((['router', 'switch'].includes(device) && ['hub1', 'hub2'].includes(slot)) || (device === 'server' && slot === 'rack'))) return false;
    this.placed[device] = slot;
    return true;
  }
  occupied(port) { return this.links.find(l => l.a === port || l.b === port); }
  connect(a, b) {
    const [ad, ap] = a.split(':'), [bd, bp] = b.split(':');
    if (ad === bd || !this.ports(ad).includes(ap) || !this.ports(bd).includes(bp) || this.occupied(a) || this.occupied(b)) return false;
    this.links.push({id:++this.serial, a, b});
    return true;
  }
  remove(id) { this.links = this.links.filter(l => l.id !== id); }
  valid(link) {
    const ends = [link.a, link.b];
    if (ends.includes('internet:net')) return ends.includes('router:wan');
    if (ends.includes('router:lan')) return ends.some(p => p.startsWith('switch:'));
    return ends.some(p => p.startsWith('switch:')) && ends.some(p => /^(dev[12]|design[12]|printer|server):net$/.test(p));
  }
  status() {
    const active = new Set(['internet']);
    let changed = true;
    while (changed) {
      changed = false;
      for (const l of this.links.filter(l => this.valid(l))) {
        const a = l.a.split(':')[0], b = l.b.split(':')[0];
        if (active.has(a) !== active.has(b)) { active.add(a); active.add(b); changed = true; }
      }
    }
    const missing = ['router','switch','dev1','dev2','design1','design2','printer','server'].filter(d => !active.has(d));
    const invalid = this.links.filter(l => !this.valid(l));
    return {active, missing, invalid, ok:missing.length === 0 && invalid.length === 0};
  }
}
if (typeof module !== 'undefined') module.exports = KskNetwork;
if (typeof window !== 'undefined') window.KskNetwork = KskNetwork;
