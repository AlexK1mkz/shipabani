const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]+?)<\/script>/)[1];

function demo(storage = new Map(), confirm = () => false, browser = {}, document = { querySelector: () => null }) {
  const context = vm.createContext({
    DCLogic: class {
      setState(change, callback) {
        const patch = typeof change === 'function' ? change(this.state) : change;
        this.state = { ...this.state, ...patch };
        this.componentDidUpdate();
        callback?.();
      }
    },
    localStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    URLSearchParams,
    window: { confirm, location: { reload() {} }, ...browser },
    document,
    setTimeout: () => 1,
    clearTimeout() {},
  });
  const api = vm.runInContext(
    script + '\n;({Component, CRM_HANDBOOK, handbookVideoId})',
    context
  );
  return { ...api, crm: new api.Component() };
}

test('video handbook opens the selected written lesson and keeps its CRM shortcut', () => {
  const dialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
  const { crm } = demo(new Map(), undefined, {}, {
    querySelector: selector => selector === '.crm-handbook-dialog' ? dialog : null,
  });
  crm.setState({screen:'instructions'});
  const topics = crm.renderVals().handbookTopics;
  assert.equal(topics.length, 8);
  assert.ok(topics.every(topic => topic.steps.length >= 2 && topic.description));
  topics.find(topic => topic.target === 'new').details();
  const details = crm.renderVals();
  assert.equal(dialog.open, true);
  assert.equal(details.handbookDialog.title, 'Создание брони');
  assert.equal(details.handbookDialog.video, false);
  assert.equal(details.handbookDialog.steps.length, 3);
  details.handbookDialog.openSection();
  assert.equal(dialog.open, false);
  assert.equal(crm.state.handbookSelection, null);
  assert.ok(crm.state.nb);
});

test('unpublished lessons offer written instructions and configured videos open only the YouTube watch URL', () => {
  const opened = [];
  const { crm, CRM_HANDBOOK, handbookVideoId } = demo(new Map(), undefined, {
    open: (...args) => opened.push(args),
  });
  crm.setState({screen:'instructions'});
  const lesson = crm.renderVals().handbookTopics[0];
  assert.equal(lesson.hasVideo, false);
  lesson.openVideo();
  assert.equal(crm.renderVals().handbookDialog.video, true);
  assert.equal(opened.length, 0);
  crm.renderVals().handbookDialog.details();
  assert.equal(crm.renderVals().handbookDialog.video, false);
  crm.renderVals().closeHandbook();
  assert.equal(crm.state.handbookSelection, null);

  assert.equal(handbookVideoId('not-a-youtube-id'), '');
  assert.equal(handbookVideoId('https://example.com'), '');
  CRM_HANDBOOK[0].videoId = 'testVideo01';
  const configured = crm.renderVals().handbookTopics[0];
  assert.equal(configured.hasVideo, true);
  assert.equal(configured.thumbnail, 'https://i.ytimg.com/vi/testVideo01/hqdefault.jpg');
  configured.openVideo();
  assert.deepEqual(opened, [['https://www.youtube.com/watch?v=testVideo01', '_blank', 'noopener,noreferrer']]);
  assert.equal(crm.state.handbookSelection, null);
});
