// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;


/* **********************************************
selig-submit-image-sample.js
  - example script to submit an image 

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

const input = new Alert()
input.title = 'Submit'
input.addAction('OK')
input.addCancelAction('Cancel')
input.addTextField('Subreddit')
input.addTextField('Title')


var img = await Photos.fromLibrary()
var imgPath = await reddit.stashImage(img)
var resp = await input.presentAlert()
var subreddit = input.textFieldValue(0)
var postTitle = input.textFieldValue(1)

var post = await reddit.postImage({
  sr:subreddit, 
  title:postTitle, 
  imagePath:imgPath
 }) 

if(post.json.errors.length == 0) {
  log('success')
} else {
  log('something went wrong')  
  log(post)
}
