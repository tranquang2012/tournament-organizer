const test = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../src/shared/errors/AppError');
const { extractReply, filterMessages, capMessages, mapVendorStatus } = require('../src/modules/admin/service/chat.service');

test('filterMessages keeps only user/assistant turns and the last 8', () => {
  const raw = [
    { role: 'system', content: 'nope' },
    { role: 'user', content: '  one  ' },
    { role: 'assistant', content: 'two' },
    { role: 'tool', content: 'ignored' },
    { role: 'user', content: '' },
    { role: 'user', content: 'three' },
  ];
  assert.deepEqual(filterMessages(raw), [
    { role: 'user', content: 'one' },
    { role: 'assistant', content: 'two' },
    { role: 'user', content: 'three' },
  ]);

  const many = Array.from({ length: 10 }, (_, i) => ({ role: 'user', content: `m${i}` }));
  assert.deepEqual(
    filterMessages(many).map((m) => m.content),
    ['m2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9']
  );
});

test('capMessages drops oldest whole turns and 413s if the newest user message is over the cap', () => {
  const prev = process.env.AI_MAX_INPUT_CHARS;
  process.env.AI_MAX_INPUT_CHARS = '10';
  try {
    assert.deepEqual(
      capMessages([
        { role: 'assistant', content: '123456' },
        { role: 'user', content: '67890' },
      ]),
      [{ role: 'user', content: '67890' }]
    );

    try {
      capMessages([{ role: 'user', content: 'abcdefghijk' }]);
      assert.fail('expected 413');
    } catch (err) {
      assert.equal(err instanceof AppError, true);
      assert.equal(err.statusCode, 413);
    }
  } finally {
    if (prev === undefined) delete process.env.AI_MAX_INPUT_CHARS;
    else process.env.AI_MAX_INPUT_CHARS = prev;
  }
});

test('extractReply concatenates output_text, notes cut-off, and never returns empty', () => {
  assert.equal(
    extractReply({
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'Hello' },
            { type: 'output_text', text: 'world' },
          ],
        },
      ],
    }),
    'Hello\nworld'
  );

  assert.equal(
    extractReply({
      status: 'incomplete',
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Partial' }] }],
    }),
    'Partial\n\n(Reply was cut off.)'
  );

  assert.equal(
    extractReply({ output: [{ type: 'refusal', refusal: 'I cannot help with that.' }] }),
    'I cannot help with that.'
  );

  assert.equal(extractReply({ output: [] }), "I couldn't generate a reply. Please try again.");
});

test('mapVendorStatus explains a missing model instead of a generic failure', () => {
  try {
    mapVendorStatus(503, {
      error: { code: 'model_not_found', message: 'No available channel for model gpt-5.6-luna' },
    }, '');
    assert.fail('expected AppError');
  } catch (err) {
    assert.equal(err instanceof AppError, true);
    assert.equal(err.statusCode, 502);
    assert.match(err.message, /AI model is not available/);
  }
});
