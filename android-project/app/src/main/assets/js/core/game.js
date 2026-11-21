// One round of Rami Tounsi. Authoritative state machine: every move goes through act().
import {
  DEFAULT_OPTIONS, makeDeck, rng, shuffle, validateMeld, penaltyValue, isJoker, describeMeld, isCleanRun,
} from './rules.js';

export class RuleError extends Error {
  constructor(key, params) { super(key); this.key = key; this.params = params || {}; }
}
const fail = (key, params) => { throw new RuleError(key, params); };

export class Round {
  /**
   * @param {{players: {id:string,name:string}[], starter?: number, seed?: number, options?: object}} cfg
   */
  constructor({ players, starter = 0, seed = Date.now(), options = {} }) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
    this.players = players.map(p => p.id);
    this.seed = seed >>> 0;
    this.rand = rng(this.seed);
    this.starter = starter % this.players.length;
    this.redeals = 0;
    this.accepted = null;      // starter who said "nal3bou"
    this.penalties = {};       // extra points during the round
    this.notes = {};           // why someone got extra points
    for (const id of this.players) { this.penalties[id] = 0; this.notes[id] = []; }
    this.log = [];
    this.deal();
    this.turnNo = 1;
  }

  deal() {
    this.stock = shuffle(makeDeck(this.opts.jokers), this.rand);
    // opaque ids: an id never tells which card it is
    const tags = shuffle(this.stock.map((_, i) => i), this.rand);
    this.stock.forEach((c, i) => { c.id = 'c' + tags[i]; });
    this.discard = [];
    this.discardBy = {};
    this.hands = {};
    this.opened = {};
    this.melds = [];
    this.meldSeq = 0;
    this.over = null;
    for (const id of this.players) { this.hands[id] = []; this.opened[id] = false; }
    // deal 14 each, starter gets a 15th and plays without drawing
    for (let k = 0; k < this.opts.handSize; k++) {
      for (let i = 0; i < this.players.length; i++) {
        this.hands[this.players[(this.starter + i) % this.players.length]].push(this.stock.pop());
      }
    }
    this.turn = this.starter;
    this.decider = this.starter;
    this.passed = [];
    this.hands[this.players[this.turn]].push(this.stock.pop());
    this.phase = this.opts.frich ? 'decide' : 'play';
    this.resetTurn();
  }

  penalize(id, pts, note) {
    this.penalties[id] += pts;
    this.notes[id].push({ k: note, pts });
  }

  get current() { return this.players[this.phase === 'decide' ? this.decider : this.turn]; }

  resetTurn() {
    this.taken = null;           // card taken from the discard pile this turn
    this.mustUse = null;         // id of that card while it still has to be melded
    this.actedSinceDraw = false;
    this.openedThisTurn = false;
  }

  hand(id) { return this.hands[id]; }

  takeCards(id, ids) {
    const hand = this.hands[id];
    if (new Set(ids).size !== ids.length) fail('e.sameCard');
    const cards = ids.map(cid => hand.find(c => c.id === cid) || fail('e.notInHand'));
    return cards;
  }

  removeFromHand(id, ids) {
    const set = new Set(ids);
    this.hands[id] = this.hands[id].filter(c => !set.has(c.id));
    if (this.mustUse && set.has(this.mustUse)) this.mustUse = null;
  }

  push(ev) {
    ev.t = this.log.length;
    this.log.push(ev);
    return ev;
  }

  refillStock() {
    if (this.stock.length) return true;
    if (this.discard.length <= 1) return false;
    const top = this.discard.pop();
    this.stock = shuffle(this.discard, this.rand);
    this.discard = [top];
    this.push({ type: 'reshuffle' });
    return true;
  }

  /** Apply an action for player `id`. Returns the logged event. Throws RuleError when illegal. */
  act(id, a) {
    if (this.over) fail('e.roundOver');
    if (id !== this.current) fail('e.notYourTurn');
    switch (a.type) {
      case 'decide': return this.decide(id, !!a.play);
      case 'draw': return this.draw(id, a.from);
      case 'undoDraw': return this.undoDraw(id);
      case 'meld': return this.meld(id, a.groups);
      case 'layoff': return this.layoff(id, a.cards, a.meld);
      case 'swap': return this.swap(id, a.card, a.meld);
      case 'discard': return this.doDiscard(id, a.card);
      default: fail('e.unknown');
    }
  }

  /**
   * "Nal3bou wala le?": asked to each player in turn, starting with the starter.
   * The first "nal3bou" starts the round (that player must then open, or pays 50).
   * If everybody says "le", the cards are dealt again.
   */
  decide(id, play) {
    if (this.phase !== 'decide') fail('e.tooLate');
    if (play) {
      this.accepted = id;
      this.phase = 'play';
      return this.push({ type: 'decide', player: id, play: true });
    }
    this.passed.push(id);
    if (this.passed.length < this.players.length) {
      this.decider = (this.decider + 1) % this.players.length;
      return this.push({ type: 'decide', player: id, play: false, next: this.players[this.decider] });
    }
    this.redeals++;
    this.deal();
    return this.push({ type: 'redeal', player: id, redeals: this.redeals });
  }

  draw(id, from) {
    if (this.phase === 'decide') fail('e.decideFirst');
    if (this.phase !== 'draw') fail('e.alreadyDrew');
    let card;
    if (from === 'discard') {
      if (!this.discard.length) fail('e.discardEmpty');
      card = this.discard.pop();
      this.taken = card.id;
      this.takenFrom = this.discardBy[card.id] || null;
      this.mustUse = card.id;
    } else {
      if (!this.refillStock()) return this.endRound(null);
      card = this.stock.pop();
    }
    this.hands[id].push(card);
    this.phase = 'play';
    return this.push({ type: 'draw', player: id, from: from === 'discard' ? 'discard' : 'stock', card: from === 'discard' ? card : undefined, cardId: card.id });
  }

  undoDraw(id) {
    if (this.phase !== 'play' || !this.mustUse) fail('e.cantUndo');
    const card = this.hands[id].find(c => c.id === this.taken);
    this.hands[id] = this.hands[id].filter(c => c.id !== this.taken);
    this.discard.push(card);
    this.taken = null;
    this.mustUse = null;
    this.phase = 'draw';
    // taking the discard and putting it back costs a penalty
    const pts = this.opts.returnPenalty || 0;
    if (pts) this.penalize(id, pts, 'n.returned');
    return this.push({ type: 'undoDraw', player: id, card, penalty: pts });
  }

  ensurePlay() {
    if (this.phase === 'decide') fail('e.decideFirst');
    if (this.phase !== 'play') fail('e.drawFirst');
  }

  meld(id, groups) {
    this.ensurePlay();
    if (!Array.isArray(groups) || !groups.length) fail('e.noSelection');
    const all = groups.flat();
    const cards = this.takeCards(id, all);
    const byId = Object.fromEntries(cards.map(c => [c.id, c]));
    const melds = groups.map(g => validateMeld(g.map(cid => byId[cid])) || fail('e.badMeld'));
    if (this.hands[id].length - all.length < 1) fail('e.keepOne');
    const pts = melds.reduce((s, m) => s + m.points, 0);
    if (!this.opened[id]) {
      if (pts < this.opts.openMin) fail('e.openMin', { min: this.opts.openMin, pts });
      if (this.mustUse && !all.includes(this.mustUse)) fail('e.mustUse');
      if (this.opts.cleanRun && !melds.some(isCleanRun)) {
        // cards stay in hand, the player pays for the false opening
        this.penalize(id, this.opts.badOpenPenalty, 'n.badOpen');
        return this.push({ type: 'penalty', player: id, points: this.opts.badOpenPenalty, reason: 'n.badOpen' });
      }
      this.opened[id] = true;
      this.openedThisTurn = true;
    }
    this.removeFromHand(id, all);
    const placed = melds.map(m => ({ id: 'm' + ++this.meldSeq, owner: id, ...m }));
    this.melds.push(...placed);
    this.actedSinceDraw = true;
    return this.push({ type: 'meld', player: id, melds: placed, points: pts, opening: this.openedThisTurn });
  }

  findMeld(mid) { return this.melds.find(m => m.id === mid) || fail('e.noMeld'); }

  layoff(id, cardIds, mid) {
    this.ensurePlay();
    if (!this.opened[id]) fail('e.openFirst');
    const cards = this.takeCards(id, cardIds);
    const m = this.findMeld(mid);
    if (this.hands[id].length - cards.length < 1) fail('e.keepOne');
    const res = validateMeld([...m.cards, ...cards]) || fail('e.cantLayoff');
    Object.assign(m, res);
    this.removeFromHand(id, cardIds);
    this.actedSinceDraw = true;
    return this.push({ type: 'layoff', player: id, meld: { ...m }, cardIds });
  }

  swap(id, cardId, mid) {
    this.ensurePlay();
    if (!this.opened[id]) fail('e.openFirstSwap');
    const [card] = this.takeCards(id, [cardId]);
    if (isJoker(card)) fail('e.swapNatural');
    const m = this.findMeld(mid);
    for (const j of m.cards.filter(isJoker)) {
      if (j.as.r !== card.r || j.as.s !== card.s) continue;
      const res = validateMeld(m.cards.map(c => (c.id === j.id ? card : c)));
      if (!res) continue;
      Object.assign(m, res);
      this.removeFromHand(id, [cardId]);
      const { as, ...joker } = j;
      this.hands[id].push(joker);
      this.actedSinceDraw = true;
      return this.push({ type: 'swap', player: id, meld: { ...m }, cardId, jokerId: joker.id });
    }
    fail('e.cantSwap');
  }

  doDiscard(id, cardId) {
    this.ensurePlay();
    if (this.mustUse) fail('e.mustUseOrUndo');
    const [card] = this.takeCards(id, [cardId]);
    if (this.taken === cardId) fail('e.sameDiscard');
    this.removeFromHand(id, [cardId]);
    this.discard.push(card);
    this.discardBy[card.id] = id;
    const ev = this.push({ type: 'discard', player: id, card });
    if (!this.hands[id].length) return this.endRound(id);
    this.turn = (this.turn + 1) % this.players.length;
    this.phase = 'draw';
    this.resetTurn();
    this.takenFrom = null;
    this.turnNo++;
    return ev;
  }

  endRound(winner) {
    // Frich: the winner opened and finished in the same turn -> everyone else takes 100,
    // and whoever threw the card the winner picked up takes 50 more.
    const frich = !!winner && this.openedThisTurn;
    const fed = frich && this.taken ? this.takenFrom : null;
    const scores = {};
    const notes = {};
    for (const p of this.players) {
      notes[p] = [...this.notes[p]];
      let s;
      if (p === winner) s = frich ? -20 : -10;
      else if (frich) { s = this.opts.closedPenalty; notes[p].push({ k: 'n.frich', pts: s }); }
      else if (!this.opened[p]) { s = this.opts.closedPenalty; notes[p].push({ k: 'n.closed', pts: s }); }
      else s = this.hands[p].reduce((t, c) => t + penaltyValue(c, this.opts), 0);
      if (p === fed) { s += this.opts.feedPenalty; notes[p].push({ k: 'n.fed', pts: this.opts.feedPenalty }); }
      if (p === this.accepted && p !== winner && !this.opened[p]) { s += this.opts.acceptPenalty; notes[p].push({ k: 'n.accepted', pts: this.opts.acceptPenalty }); }
      scores[p] = s + this.penalties[p];
    }
    this.over = { winner, rami: frich, frich, fed, scores, notes, hands: Object.fromEntries(this.players.map(p => [p, this.hands[p]])) };
    return this.push({ type: 'roundOver', ...this.over });
  }

  /** What one player may see. */
  viewFor(id) {
    return {
      you: id,
      hand: this.hands[id] ? this.hands[id].map(c => ({ ...c })) : [],
      counts: Object.fromEntries(this.players.map(p => [p, this.hands[p].length])),
      opened: { ...this.opened },
      melds: this.melds.map(m => ({ ...m, cards: m.cards.map(c => ({ ...c })), label: describeMeld(m) })),
      stock: this.stock.length,
      discard: this.discard.slice(-4),
      discardCount: this.discard.length,
      turn: this.current,
      phase: this.phase,
      taken: this.current === id ? this.taken : null,
      mustUse: this.current === id ? this.mustUse : null,
      canUndo: this.current === id && !!this.mustUse,
      openMin: this.opts.openMin,
      cleanRun: this.opts.cleanRun,
      returnPenalty: this.opts.returnPenalty || 0,
      starter: this.players[this.starter],
      accepted: this.accepted,
      redeals: this.redeals,
      passed: this.phase === 'decide' ? [...this.passed] : [],
      penalties: { ...this.penalties },
      turnNo: this.turnNo,
      over: this.over,
    };
  }
}
