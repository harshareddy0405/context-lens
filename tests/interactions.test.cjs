const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { boot } = require("./harness.cjs");
const key = fs
  .readFileSync(path.join(__dirname, "../app.js"), "utf8")
  .match(/const (?:STORAGE_KEY|STORE|KEY) = "([^"]+)"/)[1];
const fixture = async (t, options) => {
  const h = await boot(options);
  t.after(() => {
    const errors = [...h.errors];
    h.close();
    assert.deepEqual(errors, []);
  });
  return h;
};
const submit = (h, selector) =>
  h
    .$(selector)
    .dispatchEvent(
      new h.window.Event("submit", { bubbles: true, cancelable: true }),
    );
const readBlob = (h, blob) =>
  new Promise((resolve, reject) => {
    const r = new h.window.FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(blob);
  });
async function roundTrip(t, h) {
  await h.wait(450);
  const raw = h.window.localStorage.getItem(key);
  assert.ok(raw, "Interaction should persist workspace data");
  assert.equal(
    h.window.validateWorkspace(JSON.parse(raw)),
    true,
    "Generated state must satisfy its schema",
  );
  const reloaded = await fixture(t, { saved: { [key]: raw } });
  assert.equal(
    reloaded.$("#storage-notice"),
    null,
    "Valid edits must not be discarded on reload",
  );
}
test("unknown queries do not fabricate context", async (t) => {
  const h = await fixture(t);
  h.input("#queryInput", "zzqxvnotaword");
  submit(h, "#queryForm");
  assert.match(h.$("#diagMatches").textContent, /0/);
  assert.ok(!h.$("#contextOutput").textContent.includes("[1]"));
  await roundTrip(t, h);
});
test("zero-overlap chunking remains bounded and custom documents are escaped", async (t) => {
  const h = await fixture(t);
  h.click("#addDocumentButton");
  h.input("#documentTitle", "<img src=x>");
  h.input(
    "#documentText",
    "Amber evidence is specific. Blue evidence is different. Green evidence follows.",
  );
  submit(h, "#documentForm");
  h.input("#chunkOverlap", "0");
  await h.wait(250);
  assert.equal(h.$("#documentList img"), null);
  assert.ok(h.document.querySelectorAll(".chunk-card").length > 0);
  await roundTrip(t, h);
});
