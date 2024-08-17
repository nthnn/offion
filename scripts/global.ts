/*
 * This file is part of the Offion.
 * Copyright (c) 2024 Nathanne Isip
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { WebviewTag } from "electron";
import { UI } from "./ui";
import { Tab } from "./tabs";
import { Util } from "./util";

UI.backButton.addEventListener("click", ()=> {
    const activeTab: HTMLElement = UI.tabsContainer.querySelector(".tab.active") as HTMLElement;
    if(activeTab) {
        const index: string = activeTab.dataset.index as string;
        const webviewToUpdate: WebviewTag = UI.webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"] webview`) as WebviewTag;

        if(webviewToUpdate && webviewToUpdate.canGoBack())
            webviewToUpdate.goBack();
    }
});

UI.goButton.addEventListener("click", ()=> {
    const url: string = Util.ensureHttps(UI.urlInput.value);
    const activeTab: HTMLElement = UI.tabsContainer.querySelector(".tab.active") as HTMLElement;

    if(activeTab) {
        activeTab.dataset.url = url;

        const index: string = activeTab.dataset.index as string;
        const webviewToUpdate: WebviewTag = UI.webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"] webview`) as WebviewTag;

        if(webviewToUpdate)
            webviewToUpdate.src = url;
    }
    else Tab.create(url, new URL(url).hostname);
});

UI.refreshButton.addEventListener("click", ()=> {
    const activeTab: HTMLElement = UI.tabsContainer.querySelector(".tab.active") as HTMLElement;
    if(activeTab) {
        const index: string = activeTab.dataset.index as string;
        const webviewToUpdate: WebviewTag = UI.webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"] webview`) as WebviewTag;

        if(webviewToUpdate)
            webviewToUpdate.reload();
    }
});

UI.urlInput.addEventListener("keypress", (e)=> {
    if(e.key === "Enter") {
        UI.urlInput.value = Util.ensureHttps(UI.urlInput.value);
        UI.urlInput.blur();

        UI.goButton.click();
    }
});

(document.getElementById("new-tab-button") as HTMLElement).addEventListener("click", ()=> {
    Tab.create("about:blank", "New Tab");
});

document.addEventListener("keydown", (e)=> {
    if(e.ctrlKey && e.key === "w") {
        e.preventDefault();

        const activeTab: HTMLElement = UI.tabsContainer.querySelector(".tab.active") as HTMLElement;
        if(activeTab)
            Tab.close(activeTab);

        if(UI.tabsContainer.querySelectorAll(".tab").length === 0)
            window.close();
    }
    else if(e.ctrlKey && e.key === "t") {
        e.preventDefault();
        Tab.create("about:blank", "New Tab");
    }
    else if(e.ctrlKey && !e.shiftKey && !e.altKey) {
        const index: number = parseInt(e.key) - 1;

        if(index >= 0 && index < UI.tabsContainer.children.length - 1) {
            const tabs: NodeListOf<HTMLElement> = UI.tabsContainer.querySelectorAll(".tab");
            const tabToSwitch: HTMLElement = tabs[index];

            if(tabToSwitch)
                Tab.switch(tabToSwitch);
        }
    }
    else if(e.key === "F6") {
        e.preventDefault();
        UI.urlInput.focus();
    }
});

(async ()=> {
    try {
        const ipFetch: Response = await fetch("https://api.country.is/");
        const ipData: any = await ipFetch.json();

        UI.ipAddressElement.textContent = ipData.ip;
    }
    catch(error) {
        UI.ipAddressElement.textContent = "Error fetching IP";
    }
})();

Tab.create(
    "http://haystak5njsmn2hqkewecpaxetahtwhsbsa64jom2k22z5afxhnpxfid.onion/",
    "Haystak"
);