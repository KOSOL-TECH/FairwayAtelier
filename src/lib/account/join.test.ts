import { describe, expect, it } from 'vitest';
import { FRAMES, INITIAL, joinReducer, restoreJoin, type JoinState } from './join';
import { ONBOARDING } from './questions';

const run = (actions: Parameters<typeof joinReducer>[1][], from: JoinState = INITIAL) => actions.reduce(joinReducer, from);

describe('the onboarding flow', () => {
  it('has five frames: four questions and the account', () => {
    expect(FRAMES).toBe(5);
    expect(ONBOARDING).toHaveLength(FRAMES - 1);
  });

  it('moves on as soon as a question is answered', () => {
    const state = run([{ type: 'answer', question: 'golf_level', value: 'mid' }]);
    expect(state).toEqual({ step: 1, answers: { golf_level: 'mid' } });
  });

  it('reaches the account frame after four taps', () => {
    const state = run([
      { type: 'answer', question: 'golf_level', value: 'mid' },
      { type: 'answer', question: 'trip_focus', value: 'both' },
      { type: 'answer', question: 'party', value: 'friends' },
      { type: 'answer', question: 'heard_from', value: 'club' },
    ]);
    expect(state.step).toBe(4);
    expect(Object.keys(state.answers)).toHaveLength(4);
  });

  it('lets every question be skipped, storing nothing for it', () => {
    const state = run([{ type: 'skip' }, { type: 'skip' }, { type: 'skip' }, { type: 'skip' }]);
    expect(state).toEqual({ step: 4, answers: {} });
  });

  it('forgets an earlier answer when the guest goes back and skips instead', () => {
    const state = run([{ type: 'answer', question: 'golf_level', value: 'mid' }, { type: 'back' }, { type: 'skip' }]);
    expect(state).toEqual({ step: 1, answers: {} });
  });

  it('keeps answers when going back, and lets them be changed', () => {
    const state = run([
      { type: 'answer', question: 'golf_level', value: 'mid' },
      { type: 'answer', question: 'trip_focus', value: 'both' },
      { type: 'back' },
      { type: 'back' },
      { type: 'answer', question: 'golf_level', value: 'low' },
    ]);
    expect(state).toEqual({ step: 1, answers: { golf_level: 'low', trip_focus: 'both' } });
  });

  it('never leaves its five frames', () => {
    expect(run([{ type: 'back' }]).step).toBe(0);
    expect(run(Array(9).fill({ type: 'skip' })).step).toBe(4);
    expect(run([{ type: 'skip' }, { type: 'skip' }, { type: 'skip' }, { type: 'skip' }, { type: 'answer', question: 'tier', value: 'signature' }]).step).toBe(4);
  });

  it('ignores an answer that is not for the frame on screen', () => {
    expect(run([{ type: 'answer', question: 'party', value: 'friends' }])).toEqual(INITIAL);
  });
});

describe('restoreJoin', () => {
  it('picks up where the guest left off in this tab', () => {
    expect(restoreJoin(JSON.stringify({ step: 2, answers: { golf_level: 'mid', trip_focus: 'both' } }))).toEqual({
      step: 2, answers: { golf_level: 'mid', trip_focus: 'both' },
    });
  });

  it('keeps only answers to onboarding questions, with valid options', () => {
    expect(restoreJoin(JSON.stringify({ step: 4, answers: { golf_level: 'wizard', party: 'friends', tier: 'signature', x: 1 } }))).toEqual({
      step: 4, answers: { party: 'friends' },
    });
  });

  it('starts over for anything unreadable', () => {
    for (const bad of [null, '', 'not json', '[]', '{"step":9}', '{"step":-1,"answers":{}}', '{"step":"2"}']) {
      expect(restoreJoin(bad), String(bad)).toEqual(INITIAL);
    }
  });
});

describe('restoring into a running flow', () => {
  it('replaces the state with the saved one', () => {
    const saved = { step: 3, answers: { golf_level: 'mid' } };
    expect(joinReducer(INITIAL, { type: 'restore', state: saved })).toEqual(saved);
  });
});
