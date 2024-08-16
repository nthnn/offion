###
This file is part of the Offion.
Copyright (c) 2024 Nathanne Isip

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
###

{ app, BrowserWindow, globalShortcut, session } = require 'electron'
path = require 'node:path'

createWindow = ->
    win = new BrowserWindow
        width: 1200
        height: 800
        webPreferences:
            nodeIntegration: false
            contextIsolation: true
            webviewTag: true
        icon: path.join __dirname, 'assets/icons/512x512.png'
    
    win.setMenu null

    ses = session.defaultSession
    ses.clearCache().then ->
        ses.setProxy
            proxyRules: 'socks5://127.0.0.1:9050'
        .then ->
            win.loadFile path.join __dirname, 'index.html'

app.whenReady().then createWindow
app.on 'window-all-closed', ->
    app.quit() if process.platform isnt 'darwin'

app.on 'activate', ->
    createWindow() if BrowserWindow.getAllWindows().length is 0

app.on 'ready', ->
    app.on 'browser-window-focus', ->
        globalShortcut.registerAll
        'CommandOrControl+R'
        'CommandOrControl+Shift+I'
        ->
            return

    app.on 'browser-window-blur', ->
        globalShortcut.unregisterAll()

app.commandLine.appendSwitch 'ignore-gpu-blacklist'
app.commandLine.appendSwitch 'disable-gpu'
app.commandLine.appendSwitch 'disable-gpu-compositing'
