// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;

/* **********************************************
selig-widget-sample.js
  - example widget script using Selig 

author : github.com/supermamon
version: 1.0.0
created: 29 Apr 2021
about  : github.com/supermamon/scriptable-selig
changelog: --------------------------------------
  2021-04-29
  - Initial release
********************************************** */

const Selig = importModule('Selig')
const reddit = new Selig()
await reddit.init()


var me = await reddit.me()

const w = new ListWidget()

const b1 = w.addText(me.name)
b1.centerAlignText()
b1.font = Font.systemFont(18)

w.addSpacer(10)

const b2 = w.addText(`karma: ${me.total_karma}`)
b2.centerAlignText()
b2.font = Font.systemFont(16)

Script.setWidget(w)
Script.complete()
if (config.runsInApp) await w.presentSmall()
