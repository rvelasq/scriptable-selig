// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: user-secret;

/* **********************************************
Selig - Reddit API Wrapper for Scriptable
author : github.com/supermamon
version: 1.2.0
created: 29 Apr 2021
about  : github.com/supermamon/scriptable-selig
changelog: --------------------------------------
  v1.2.0 | 2023-06-09
  - feat: getMyOverview method to list post and
          comment history
  - feat: updatePost method to update post or
          comment text
  v1.1.0 | 2023-04-16
  - fix: cokkies loading incorrectly
  - feat: inbox messages - read/delete
  - feat: list my subreddits
  - feat: mark favorite
  - style: apply linting
  v1.0.0 | 2021-04-29
  - Initial release
********************************************** */

const MODULE_ID = 'Selig'
const DEBUG = false
var log = (args) => { if (DEBUG) console.log(`${MODULE_ID}: ${args}`) }

/* **********************************************
node-fs.js 
  - simulate selected node File System methods
********************************************** */
class fs {
  constructor() { }
  static isCloud() { return module.filename.includes('Documents/iCloud~') }
  static fm() { return fs.isCloud() ? FileManager.iCloud() : FileManager.local() }
  static async readFile(path) {
    let fm = fs.fm()
    if (!fm.fileExists(path)) return null
    if (fm.isFileStoredIniCloud(path)) {
      await fm.downloadFileFromiCloud(path)
    }
    return fm.readString(path)
  }
  static async writeFile(path, data) {
    let fm = fs.fm()
    if (fm.fileExists(path) && fm.isFileStoredIniCloud(path)) {
      await fm.downloadFileFromiCloud(path)
    }
    var saveData = Data.fromString('')
    if (data.constructor == String) {
      log('String')
      saveData = Data.fromString(data)
    } else if (`${data.constructor}`.match(/Data/)) {
      log('Data')
      saveData = data
    } else if (`${data.constructor}`.match(/Object/)) {
      log('JSON')
      saveData = Data.fromString(JSON.stringify(data))
    } else if (`${data.constructor}`.match(/Image/)) {
      log('Image')
      saveData = Data.fromJPEG(data)
    } else {
      log('Other')
      saveData = Data.fromString(`${data}`)
    }
    fm.write(path, saveData)
    return true
  }
  static async rm(path) {
    let fm = fs.fm()
    if (!fm.fileExists(path)) {
      throw new Error('file does not exists')
    }
    if (fm.fileExists(path) && fm.isFileStoredIniCloud(path)) {
      await fm.downloadFileFromiCloud(path)
    }
    fm.remove(path)
  }
  static async rmdir(path) {
    await fs.rm(path)
  }
  static mkdirSync(path, { recursive = false }) {
    let fm = fs.fm()
    fm.createDirectory(path, recursive)
  }
  static existsSync(path) {
    return fs.fm().fileExists(path)
  }
  static readdirSync(path) {
    return fs.fm().listContents(path)
  }
  static async copyFile(src, dest) {
    if (!fs.existsSync(src)) {
      throw new Error('Source file does not exists.')
    }
    if (fs.existsSync(dest)) {
      await fs.rm(dest)
    }
    await fs.fm().copy(src, dest)

  }
}
/* **********************************************
node-path.js 
  - simulate selected node File System methods
********************************************** */
class path {
  constructor() { }
  static isCloud() { return module.filename.includes('Documents/iCloud~') }
  static fm() { return path.isCloud() ? FileManager.iCloud() : FileManager.local() }

  //----------------------------------------------
  static join(left, right) {

    return path.fm().joinPath(left, right)
  }
  //----------------------------------------------
  static extname(filePath) {
    return path.fm().fileExtension(filePath)
  }
  static basename(filePath, ext) {
    var base = path.fm().fileName(filePath, true)
    if (ext) {
      base = base.replace(ext, '')
    }
    return base
  }
}
const { fm, readFile, writeFile, rm, rmdir, mkdirSync, existsSync, readdirSync, copyFile } = fs
const HOME = fm().documentsDirectory()

/* **********************************************
ui-utils.js 
  - utility functions for user interface
********************************************** */
class UI {
  static async presentAlert(prompt = "", items = ["OK"], asSheet = false) {
    const isMac = Device.isPad() && Device.isFaceUp() == Device.isFaceDown()

    var options = [...items]

    // handle mac display issue 
    //if (isMac) options = options.reverse()

    options = options.map(option => `${option}`)

    let alert = new Alert()
    alert.message = prompt
    for (var n = 0; n < options.length; n++) {
      alert.addAction(options[n])
    }
    let resp = asSheet ? await alert.presentSheet() : await alert.presentAlert()

    return items.map(item => `${item}`).indexOf(options[resp])
  }
  //------------------------------------------------
  static async askForInput(fields, title) {

    var input = new Alert()
    input.title = title ? title : 'Input'
    input.addAction('OK')
    input.addCancelAction('Cancel')

    for (var i = 0; i < fields.length; i++) {
      let f = fields[i]
      input.addTextField(f.name || f.id, (f.value || ''))
    }

    const button = await input.presentAlert()
    var resp = {}

    if (button == 0) {
      for (var i = 0; i < fields.length; i++) {
        let f = fields[i]
        log(`${f.id} = ${input.textFieldValue(i)}`)
        resp[f.id] = input.textFieldValue(i)
      }
      return resp
    } else {
      return null
    }

  }
  static async presentPrompt(title, fields) {
    await askForInput(fields, title)
  }


  static async chooseFromList(items = ["Cancel"], prompt = "Choose One", returnIndex = false) {
    // HACK: identify mac 
    var options = [...items]

    if (options.indexOf('Cancel') == -1) {
      options.push('Cancel')
    }

    // stringify because addAction only accepts string
    options = options.map(option => `${option}`)

    let alert = new Alert()
    alert.message = prompt
    for (var n = 0; n < options.length; n++) {
      alert.addAction(options[n])
    }
    let resp = await alert.presentAlert()
    if (options[resp] == 'Cancel') return null

    if (returnIndex) return resp
    return items[resp]

  }

  static async pickPhotos(count) {
    let photos = []
    if (count) {
      for (var i = 0; i < count; i++) {
        photos.push(await Photos.fromLibrary())
      }
    } else {
      while (true) {
        photos.push(await Photos.fromLibrary())
        var more = await UI.chooseFromList(['Yes', 'No'], 'More?')
        if (more != 'Yes') break;
      }
    }
    return photos
  }

}
const { presentAlert, askForInput, chooseFromList } = UI

/* **********************************************
Utility functions
********************************************** */
class Utl {
  //---------------------------------------------
  static openUrl(url) {
    Safari.open(url)
  }
  //---------------------------------------------
  static jsonToUri(json) {
    var keys = Object.keys(json)
    var url = keys
      .map(key => `${key}=${encodeURIComponent(json[key])}`)
      .join('&')
    return url
  }
  //---------------------------------------------
  static cookieArrayToUri(json) {
    return json.map(cookie => {
      return `${cookie.name}=${encodeURIComponent(cookie.value)}`
    }).join('&')
    var keys = Object.keys(json)
    var url = keys
      .map(key => `${key}=${encodeURIComponent(json[key])}`)
      .join('&')
    return url
  }
  //---------------------------------------------
  static randomString(length) {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
  }
  //---------------------------------------------
  static async request({ url, method = 'GET', headers = {}, cookies = "", form = "", json }) {
    log(`::Utl.request(${url})`)
    log(`> headers = ${JSON.stringify(headers)}`)
    log(`> cookies = ${cookies}`)
    log(`> form = ${form}`)
    log(`> json = ${json}`)


    let req = new Request(url)
    req.method = method

    // the headers are collected like this 
    // because for some reason, the request
    // object doesn't accept changes after the
    // headers are assinged it doesn't give an 
    // error but the changes aren't applied
    let fheaders = headers
    if (cookies) fheaders["Cookie"] = cookies

    if (form) {
      fheaders["Content-Type"] = 'application/x-www-form-urlencoded'
      req.body = form
    }
    if (json) {
      fheaders["Content-Type"] = "application/json"
      req.body = JSON.stringify(json)
    }
    req.headers = fheaders


    var resp;
    if (fheaders["Content-Type"] && fheaders["Content-Type"].includes("image")) {
      resp = await req.loadImage()
    } else {
      resp = await req.loadString()
    }

    //resp = await req.loadString()
    //log(`::Utl.request:: resp=${resp}`)

    return { body: resp, response: req.response }
  }
  //---------------------------------------------
  /* ********************************************
  function    : uploadRequest
  description : upload a file
  arguments   :
    url     : the endpoint where to upload the file
    method  : request method, default to POST
    headers : JSON indicating the headers of the request
    cookies : a url-encoded string of cookies
    fields  : an array of JSON {name, value}
    filePath: the path of the file to uplaod
  ********************************************* */
  static async uploadRequest({ url, method = 'POST', headers = {}, cookies = "", fields = [], filePath }) {
    let req = new Request(url)
    req.method = method
    let hdrs = headers
    if (cookies) {
      hdrs["Cookie"] = cookies
    }
    req.headers = hdrs

    // add  fields to the request
    fields.forEach(field => {
      req.addParameterToMultipart(field.name, field.value)
    })

    // attached the file to the request
    req.addFileToMultipart(filePath, 'file', path.basename(filePath))

    // response will be received in XML format
    let body = await req.loadString()

    return { body: body, response: req.response }

  }
}

/* **********************************************
Reddit API Endpoints
********************************************** */
//--[ API Endpoints ] ---------------------------
const API_PATH = {
  "me": "api/v1/me",
  "karma": "api/v1/me/karma",
  "trophies": "api/v1/me/trophies",
  "submit": "api/submit",
  "submit_gallery_post": "api/submit_gallery_post.json",
  "media_asset": "api/media/asset.json",
  "inbox": "message/inbox.json?show=all",
}

/* **********************************************
Selig Class - to interface with reddit API
********************************************** */
class Selig {

  constructor() {
    log('::contructor()')

    // prepare storage dirs
    this.cache = path.join(HOME, 'cache/selig')
    this.home = path.join(this.cache, 'home')
    this.temp = path.join(this.cache, 'temp')
    this.configFile = path.join(this.cache, 'config.json')
    this.currentUserFile = path.join(this.cache, 'usr.current.json')

    mkdirSync(this.cache, { recursive: true })
    mkdirSync(this.home, { recursive: true })
    mkdirSync(this.temp, { recursive: true })

    this.redirect_uri = 'https://open.scriptable.app/run/Selig'

    // configuration
    this.client_id = ''
    this.client_secret = ''
    this.user_agent = ''
    this.creds = ''
    this.videoThumbnailFile = path.join(this.temp, 'thmb.jpg')

    // default scope, can be overriden
    this.scope = 'identity edit flair history mysubreddits read save submit privatemessages subscribe'


  }
  async init() {
    const THUMBNAILB64 = '/9j/4AAQSkZJRgABAQAASABIAAD/4QBYRXhpZgAATU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD/wAARCAABAAEDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/9sAQwEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/90ABAAB/9oADAMBAAIRAxEAPwD/AD/6AP/Z'
    if (!existsSync(this.videoThumbnailFile)) {
      var img = Data.fromBase64String(THUMBNAILB64)
      await writeFile(this.videoThumbnailFile, img)
    }

    this.configured = await this.loadConfig()
  }
  // --------------------------------------------
  async reset() {

    await rm(this.configFile)
    await rm(this.currentUserFile)
    await rmdir(this.temp)
    await rmdir(this.home)
    await rmdir(this.cache)

  }
  // --------------------------------------------
  async authenticate() {
    var state = 'selig_logging_in'

    var query = Utl.jsonToUri({
      client_id: this.client_id,
      response_type: 'code',
      state: state,
      redirect_uri: this.redirect_uri,
      scope: this.scope,
      duration: 'permanent'
    })
    var url = `https://www.reddit.com/api/v1/authorize.compact?${query}`
    Utl.openUrl(url)
  }

  // --------------------------------------------
  async handleRedirect(params) {

    var url = `https://www.reddit.com/api/v1/access_token`
    var req = new Request(url)
    req.method = 'POST'
    req.headers = {
      Authorization: `Basic ${this.creds}`,
      "Content-Type": 'application/x-www-form-urlencoded'
    }
    req.body = Utl.jsonToUri({
      grant_type: 'authorization_code',
      code: `${params.code}`,
      redirect_uri: this.redirect_uri,
    })

    var token = await req.loadJSON()
    if (token.error) {
      await presentAlert(token.error)
      return token
    } else {
      var savedToken = await this._saveToken(token)
      return savedToken
    }

  }
  // --------------------------------------------
  async _getToken() {
    log('::_getToken()')

    if (!existsSync(this.currentUserFile)) {
      throw new Error('Missing access token.')
    }
    let contents = await readFile(this.currentUserFile)
    let token = JSON.parse(contents)

    return token
  }
  // --------------------------------------------
  async _refreshToken(force = false) {
    log('::_refreshToken()')
    let current = await this._getToken()

    log(`> current = ${new Date(current.expires_on)}`)

    let expires_on = new Date(current.expires_on)
    if (!force && (new Date()) < expires_on) {
      log('  access token still valid')
      return current
    }

    let refresh_token = current.refresh_token

    let resp = await Utl.request({
      url: 'https://www.reddit.com/api/v1/access_token',
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.creds}`
      },
      form: Utl.jsonToUri({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      })
    })

    let body = JSON.parse(resp.body)

    if (body.error) {
      throw new Error('Unable to refresh token')
    } else {
      return (await this._saveToken(body))
    }

  }

  // ---------------------------------------------
  async _saveToken(token) {
    log('::_saveToken()')
    var now = new Date()

    var expires = now.setSeconds(now.getSeconds() + token.expires_in)
    token['expires_on'] = expires
    var req = new Request(`https://oauth.reddit.com/${API_PATH.me}`)
    req.headers = {
      Authorization: `Bearer ${token.access_token}`,
      "User-Agent": this.user_agent
    }
    var user = await req.loadJSON()

    token['username'] = user.name

    // save to active user token
    var currentUser = this.currentUserFile
    await writeFile(currentUser, token)

    // save a copy to home path
    var usrpath = path.join(this.home, `usr.${user.name}.json`)
    await writeFile(usrpath, token)

    this.currentUser = user.name
    return token

  }

  // --------------------------------------------
  async _get({ endpoint, cookies = "", headers = {}, fullurl = '' }) {
    log(`::_get(${endpoint})`)

    //var endpoint = path
    try {

      let token = await this._refreshToken()
      var creds = `Bearer ${token.access_token}`
      //console.warn(creds)

      // default headers
      var hdrs = {
        "Authorization": creds,
        "User-Agent": this.user_agent
      }
      // additional headers
      Object.assign(hdrs, headers)
      var resp = await Utl.request({
        url: (fullurl || `https://oauth.reddit.com/${endpoint}`),
        headers: hdrs,
        cookies: cookies
      })

      return resp

    } catch (e) {
      throw new Error(e.message)
    }


  }

  // --------------------------------------------
  async _post({ path, data, form, json, cookies }) {
    log(`::__post(${path})`)

    let token = await this._refreshToken()
    var creds = `Bearer ${token.access_token}`
    let endpoint = path

    var resp = await Utl.request({
      url: `https://oauth.reddit.com/${endpoint}`,
      method: 'POST',
      headers: {
        "Authorization": creds,
        "User-Agent": this.user_agent
      },
      cookies: cookies,
      form: form ? Utl.jsonToUri(form) : data ? Utl.jsonToUri(data) : "",
      json: json
    })

    //console.warn(resp.body)

    //await presentAlert(resp)
    return JSON.parse(resp.body)

  }

  // --------------------------------------------
  async _uploadMedia(type, filePath) {
    log(`::_uploadMedia(${type}, ${filePath})`)

    let extension = path.extname(filePath).toLowerCase().replace(/^\./, '')

    const mime_types = {
      "png": "image/png",
      "mov": "video/quicktime",
      "mp4": "video/mp4",
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "gif": "image/gif",
    }
    let mime_type = mime_types[extension]
    if (!mime_type) mime_type = "image/jpeg"

    // prepare an upload lease
    // this should return a JSON with the necessary
    // endpoints and fields to send back
    let lease = await this._post({
      path: API_PATH.media_asset,
      form: {
        "mimetype": mime_type,
        "filepath": "~/uploads"
      },
      cookies: await this._getCookies()

    })

    let { body } = await Utl.uploadRequest({
      url: `https:${lease.args.action}`,
      fields: lease.args.fields,
      filePath: filePath
    })
    //console.log(`body = ${body}`)

    if (/Code/.test(body)) {
      throw new Error('Failed uploading media')
    }

    // body is in XML find the media url in <Location>
    let asset_url = body.match(/Location>([^<]+)/)[1]

    // return both the asset_id and url.
    return {
      id: lease.asset.asset_id,
      url: asset_url
    }

  }

  // --------------------------------------------
  async _getCookies() {
    log('::_getCookies()')
    let resp = await this._get({ endpoint: API_PATH.me })
    //log(JSON.stringify(resp.response.cookies))
    return Utl.cookieArrayToUri(resp.response.cookies)
  }

  // --------------------------------------------
  async loadConfig(config) {
    log('::loadConfig()')

    // load configuration from file if not passed
    if (!config) {

      if (!existsSync(this.configFile)) {
        return false
      }

      config = JSON.parse(await readFile(this.configFile))

    }

    // there must be at least a client_id and client_secret on the config file
    if (!config['client_id'] || !config['client_secret']) {
      log(`> missing client_id or client_secret`)
      return false
    }

    // configurable
    this.client_id = config.client_id
    this.client_secret = config.client_secret
    this.user_agent = config.user_agent || "Custom Client on Scriptable App"

    // runtime
    this.creds = Data.fromString(`${this.client_id}:${this.client_secret}`).toBase64String()

    return true

  }

  async stashImage(imageObject, type = 'jpeg') {
    let data = type == 'png' ? Data.fromPNG(imageObject) : Data.fromJPEG(imageObject)
    let filename = `${Utl.randomString(8)}.${type == 'png' ? 'png' : 'jpg'}`
    let filepath = path.join(this.temp, filename)

    await writeFile(filepath, data)
    return filepath
  }
  async unstashImages(paths) {
    for (const file of paths) {
      await rm(file)
    }
  }

  // --------------------------------------------
  async applyConfig(config) {
    log('::applyConfig()')
    if (!config.hasOwnProperty('client_id') && !config.hasOwnProperty('client_secret')) {
      this.configured = false
      return false
    }
    await writeFile(this.configFile, config)
    this.configured = await this.loadConfig(config)
    return this.configured
  }

  // --------------------------------------------
  async me() {
    log('::me()')
    try {
      var me = await this._get({ endpoint: API_PATH.me })
      return JSON.parse(me.body)
    } catch (e) {
      throw new Error(e.message)
    }
  }
  ///subreddits/mine/subscriber
  // --------------------------------------------
  async mySubreddits() {
    log('::mySubreddits()')


    try {
      var after = '';
      var subs = []

      while (true) {
        var resp = await this._get({ endpoint: `/subreddits/mine/subscriber?after=${after}` })
        var list = JSON.parse(resp.body)
        //return list
        //break;
        subs.push(...list.data.children)
        after = list.data.after
        if (!after) break;
      }

      return subs
    } catch (e) {
      throw new Error(e.message)
    }
  }



  // --------------------------------------------
  async karma() {
    log('::me()')
    try {
      var resp = await this._get({ endpoint: API_PATH.karma })
      return JSON.parse(resp.body).data
    } catch (e) {
      throw new Error(e.message)
    }
  }

  // --------------------------------------------
  async trophies() {
    log('::me()')
    try {
      var resp = await this._get({ endpoint: API_PATH.trophies })
      return JSON.parse(resp.body).data
    } catch (e) {
      throw new Error(e.message)
    }
  }

  // --------------------------------------------
  async inbox({ after = '', limit = 25 } = {}) {
    log('::inbox()')
    try {
      //let cookies = await this._getCookies()
      let endpoint = `message/inbox.json?after=${after}&limit=${limit}`
      var resp = await this._get({ endpoint: endpoint })
      return JSON.parse(resp.body).data
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async deleteMessage(id) {
    log('::deleteMessage()')
    try {
      let endpoint = `api/del_msg`
      var form = { id: id }
      return await this._post({ path: endpoint, form: form })
    } catch (e) {
      throw new Error(e.message)
    }


  }

  // --------------------------------------------
  listAccounts() {
    log('::listAccounts()')
    var users = readdirSync(this.home)
      .filter(file => /^usr\..+\.json$/.test(file))
      .map(userfile => userfile.replace('usr.', '').replace('.json', ''))
    return users
  }

  // --------------------------------------------
  async switchAccount(username) {
    log('::switchUser()')

    var src = path.join(this.home, `usr.${username}.json`)
    var dest = path.join(this.cache, 'usr.current.json')

    await copyFile(src, dest)
    this.currentUser = username
    return username
  }


  async makeFavorite(sr_name, make_favorite = true) {
    log('::makeFavorite')
    try {
      let path = `api/favorite?raw_json=1`
      var form = { make_favorite, sr_name, api_type: 'json' }
      return await this._post({ path, form })
    } catch (e) {
      throw new Error(e.message)
    }

  }

  // --------------------------------------------
  async postSelfText({ sr, title, text, nsfw = false, sendreplies = true, resubmit = false, spoiler = false }) {
    return await this._post({
      path: API_PATH.submit, data: {
        "api_type": "json",
        "kind": "self",
        "sr": sr,
        "text": text,
        "title": title,
        "nsfw": nsfw,
        "sendreplies": sendreplies,
        "resubmit": resubmit,
        "spoiler": spoiler
      }
    })
  }

  // --------------------------------------------
  async postImage({ sr, title, imagePath, nsfw = false, sendreplies = true, resubmit = false, spoiler = false }) {

    let asset = await this._uploadMedia('image', imagePath)

    return (await this._post({
      path: API_PATH.submit, data: {
        "api_type": "json",
        "kind": "image",
        "sr": sr,
        "url": asset.url,
        "title": title,
        "nsfw": nsfw,
        "sendreplies": sendreplies,
        "resubmit": resubmit,
        "spoiler": spoiler
      }
    }))

  }

  // --------------------------------------------
  async postVideo({ sr, title, videoPath, thumbnailPath, nsfw = false, sendreplies = true, resubmit = false, spoiler = false }) {
    log(`::postVideo(${sr}, "${title}", ${videoPath})`)

    let tnpath = thumbnailPath || this.videoThumbnailFile

    let thumbnail = await this._uploadMedia('image', tnpath)
    let asset = await this._uploadMedia('video', videoPath)

    if (asset.error) {
      return asset
    }
    log(`asset = ${JSON.stringify(asset)}`)

    let cookies = await this._getCookies()

    return (await this._post({
      path: API_PATH.submit, data: {
        "api_type": "json",
        "sr": sr,
        "title": title,
        "kind": "video",
        "url": asset.url,
        "video_poster_url": thumbnail.url,
        "nsfw": nsfw,
        "sendreplies": sendreplies,
        "resubmit": resubmit,
        "spoiler": spoiler
      }, cookies: cookies
    }))

  }

  // --------------------------------------------
  async postGallery({ sr, title, imagePaths, nsfw = false, sendreplies = true, resubmit = false, spoiler = false }) {

    let items = []

    log('uploading images')
    for (var i = 0; i < imagePaths.length; i++) {
      let imagePath = imagePaths[i]

      // upload
      let asset = await this._uploadMedia('image', imagePath)
      log(` assetid : ${asset.id}`)
      log(` url     : ${asset.url}`)

      // add to list
      items.push({ media_id: asset.id, caption: "", outbound_url: "" })

    }

    let cookies = await this._getCookies()

    return (await this._post({
      path: API_PATH.submit_gallery_post, json: {
        "api_type": "json",
        "sr": sr,
        "title": title,
        "items": items,
        "nsfw": nsfw,
        "sendreplies": sendreplies,
        "resubmit": resubmit,
        "spoiler": spoiler
      }, cookies: cookies
    }))

  }

  async getMyOverview({ username = '', after = '', before = '', sort = 'new', limit = 25 } = {}) {
    log('::getMyOverview()')
    try {

      if (!username) {
        let me = await this.me()
        username = me.name
      }
      let endpoint = `/user/${username}/overview?after=${after}&before=${before}&sort=${sort}&limit=${limit}`
      var resp = await this._get({ endpoint: endpoint })
      return JSON.parse(resp.body).data
    } catch (e) {
      throw new Error(e.message)
    }

  }

  async getUserComments({ username = '', after = '', before = '', sort = 'new', limit = 25 } = {}) {
    log('::getUserComments()')
    try {

      if (!username) {
        let me = await this.me()
        username = me.name
      }
      let endpoint = `/user/${username}/comments?after=${after}&before=${before}&sort=${sort}&limit=${limit}`
      var resp = await this._get({ endpoint: endpoint })
      return JSON.parse(resp.body).data
    } catch (e) {
      throw new Error(e.message)
    }

  }

  async getUserPosts({ username = '', after = '', before = '', sort = 'new', limit = 25 } = {}) {
    log('::getUserPosts()')
    try {

      if (!username) {
        let me = await this.me()
        username = me.name
      }
      let endpoint = `/user/${username}/submitted?after=${after}&before=${before}&sort=${sort}&limit=${limit}`
      var resp = await this._get({ endpoint: endpoint })
      return JSON.parse(resp.body).data
    } catch (e) {
      throw new Error(e.message)
    }

  }

  async getUserSaved({ username = '', after = '', before = '', sort = 'new', limit = 25 } = {}) {
    log('::getUserSaved()')
    try {

      if (!username) {
        let me = await this.me()
        username = me.name
      }
      let endpoint = `/user/${username}/saved?after=${after}&before=${before}&sort=${sort}&limit=${limit}`
      var resp = await this._get({ endpoint: endpoint })
      return JSON.parse(resp.body).data
    } catch (e) {
      throw new Error(e.message)
    }

  }



  async updatePost(thing_id, text) {
    try {
      let endpoint = `api/editusertext`
      var form = { thing_id, text }
      return await this._post({ path: endpoint, form: form })
    } catch (e) {
      throw new Error(e.message)
    }

  }

  async deletePost(thing_id) {
    log(`deleting ${thing_id}`)
    try {
      let endpoint = `api/del`
      var form = { id: thing_id }
      return await this._post({ path: endpoint, form: form })
    } catch (e) {
      throw new Error(e.message)
    }
  }



}

module.exports = Selig

/* **********************************************
Configuration UI
********************************************** */
const module_name = module.filename.match(/[^\/]+$/)[0].replace('.js', '')
if (module_name == Script.name()) {
  await(async () => {

    var reddit = new Selig()
    await reddit.init()

    log(`configured = ${reddit.configured}`)

    async function uiConfigDialog(reddit) {

      var resp = await askForInput([
        { id: 'client_id', name: 'Client ID', value: reddit.client_id },
        { id: 'client_secret', name: 'Client Secret', value: reddit.client_secret },
        { id: 'user_agent', name: 'User Agent', value: reddit.user_agent },
      ], 'Selig Configuration')

      if (resp) {
        var success = await reddit.applyConfig(resp)
        if (!success) {
          await presentAlert('Configuration not applied.')
        }
        return success
      } else {
        return false
      }
    }

    if (!reddit.configured) {
      var prompt1 = 'Selig is not yet configured. You will need to create a Reddit app with yout reddit account.'
      var actions1 = ['Open Reddit Prefs Page', 'Already Done', 'Cancel']
      var button1 = await chooseFromList(actions1, prompt1)
      switch (button1) {
        case 'Open Reddit Prefs Page': // Open prefs
          Safari.open('https://www.reddit.com/prefs/apps')
          return
          break;
        case 'Already Done':
          // do nothing. next step
          break;
        default:
          return
      }

      if (!(await uiConfigDialog(reddit))) return

    }

    if (!reddit.configured) {
      await presentAlert(`${MODULE_ID} is not configured yet. Please re-run this script.`)
      return
    }

    if (args.queryParameters["state"]) {
      let token = await reddit.handleRedirect(args.queryParameters)
      if (!token.error) {
        await presentAlert(`Logged in as ${token.username}`)
      }
    } else {
      // menu
      let opts = [
        'Configure',
        'Reset',
        'Authenticate',
        "Switch Account",
        "Who Am I?",
        "Post Self Text",
        'Cancel'
      ]

      var runloop = true
      while (runloop) {
        let resp = await chooseFromList(opts, `${MODULE_ID} for Reddit`)
        switch (resp) {
          case 'Configure':
            await uiConfigDialog(reddit)
            break;

          case 'Reset':
            var buttons = ['No', 'Yes']
            var sel = await presentAlert('This will delete all configurations and user settings. Continue?', buttons)

            if (buttons[sel] == 'Yes') {
              await reddit.reset()
              await presentAlert(`Reset complete. Please run ${MODULE_ID} again to configure.`)
            }
            return
            break;

          case 'Authenticate':
            await reddit.authenticate()
            break;

          case 'Who Am I?':

            let me = await reddit.me()
            let desc = `${me.name}\n\nTotal Karma:${me.total_karma}`

            await presentAlert(`${desc}!`)
            break;

          case 'Switch Account':
            var users = reddit.listAccounts()
            if (users.length == 0) {
              await presentAlert('No accounts configured yet. Use Authenticate to login.')
            }

            users.push('Cancel')
            var username = await chooseFromList(users, 'Switch User')

            if (username) {
              var newUser = await reddit.switchAccount(username)
              await presentAlert(`User is now ${newUser}.`)
            }
            break;
          case 'Post Self Text':
            var input = await askForInput([
              { id: 'sr', name: 'Subreddit' },
              { id: 'title', name: 'Title' },
              { id: 'text', name: 'Text' },
            ], 'Post Text')

            //if (!input) await presentAlert('Input not provided')
            if (input) {
              let resp = await reddit.postSelfText(input)
              if (resp.json.errors.length == 0) await presentAlert('Posted')
            }
            break;


          default:
            runloop = false
        } // switch
      } // while runloop

    } // else menu

  })() //await (async ()=>{

} //if self

