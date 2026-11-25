const assert = require("assert").strict;
const { spawnSync } = require("child_process");
require("ts-node").register({ transpileOnly: true, compilerOptions: { module: "CommonJS" } });
const { convert_to_org } = require("../src/modules/org-converter");
const captured = new Map();
global.Database = { sharedInstance: () => ({
  getNoteById: id => captured.get(id),
  getDocumentById: () => ({ pathFile: "/clips/讲座.mov" }),
}) };

function note(id, fields = {}) {
  return { noteId: id, childNotes: [], createDate: 0, modifiedDate: 0, ...fields };
}
const text = note("p1", { noteTitle: "第一章\nIntroduction", startPage: 0, endPage: 1, excerptText: "Original\n* literal bullet" });
const child = note("p2", { excerptText: "An untitled excerpt", notesText: "Merged note" });
const video = note("v1", { noteTitle: "Video marker" });
text.childNotes.push(child);
const root = note("root", { noteTitle: "课程", childNotes: [text] });
const render = () => convert_to_org({ data: root });

let org = render();
assert.match(org, /^\*\* 第一章 Introduction$/m);
assert.match(org, /^\*\*\* An untitled excerpt$/m);
assert.match(org, /:NOTER_PAGE: 0/);
assert.match(org, /:IS_MERGED: true/);
assert.match(org, /Original\n \* literal bullet/);
assert.doesNotMatch(org, /undefined|Invalid date/);
assert.doesNotMatch(org, /:ID: p2/);

root.childNotes.push(video);
captured.set("v1", { excerptPic: { video: "media" }, startPos: "MN3VIDEO|100000|0.9", endPos: "invalid" });
org = render();
assert.match(org, /^\*\* 课程$/m);
assert.match(org, /^\*\*\* 第一章 Introduction$/m);
assert.match(org, /^\*\*\*\* An untitled excerpt$/m);
assert.match(org, /^\*\*\* Video marker$/m);
assert.match(org, /:MPV_POSITION_START: 25:00:00/);
assert.doesNotMatch(org, /MPV_POSITION_END/);

// Optional independent check with the same parser used by the destination editor.
if (process.argv.includes("--emacs")) {
  const check = `(progn (require 'org) (with-temp-buffer
    (insert (decode-coding-string (base64-decode-string (getenv "ORG_FIXTURE")) 'utf-8))
    (org-mode)
    (let ((levels (org-element-map (org-element-parse-buffer) 'headline
                    (lambda (h) (org-element-property :level h)))))
      (unless (equal levels '(2 3 4 3)) (error "Unexpected outline: %S" levels)))
    (goto-char (point-max)) (org-back-to-heading t)
    (unless (equal (org-entry-get nil "MPV_VIDEO_FILENAME" t) "讲座.mov") (error "Missing inherited video"))
    (unless (equal (org-entry-get nil "MPV_POSITION_START") "25:00:00") (error "Missing marker"))))`;
  const result = spawnSync("emacs", ["-Q", "--batch", "--eval", check], { encoding: "utf8",
    env: { ...process.env, ORG_FIXTURE: Buffer.from(org).toString("base64") } });
  assert.equal(result.status, 0, result.error?.message || result.stderr);
}
console.log("Verified document and video outlines, links, page zero, and merged text.");
