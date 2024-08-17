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

const ipAddressElement: HTMLElement = document.getElementById("ip-address") as HTMLElement;
const tabsContainer: HTMLElement = document.getElementById("tabs-container") as HTMLElement;
const webviewContainer: HTMLElement = document.getElementById("webview-container") as HTMLElement;

const urlInput: HTMLInputElement = document.getElementById("url-input") as HTMLInputElement;
const goButton: HTMLButtonElement = document.getElementById("go-button") as HTMLButtonElement;

function fetchFavicon(url: string): Promise<string> {
    return new Promise((resolve)=> {
        if(url === "about:blank") {
            resolve("");
            return;
        }

        const faviconUrl: string = new URL("/favicon.ico", new URL(ensureHttps(url)).origin).href;
        const img: HTMLImageElement = new Image();

        img.src = faviconUrl;
        img.onload = ()=> resolve(faviconUrl);
        img.onerror = ()=> resolve("");
    });
}

function ensureHttps(url: string): string {
    if(!/^https?:\/\//i.test(url) && !/^about:/i.test(url))
        url = "https://" + url;
    return url;
}

function createTab(url: string, title: string): void {
    const tab: HTMLElement = document.createElement("div");
    tab.className = "tab";
    tab.draggable = true;
    tab.dataset.url = url;
    tab.dataset.index = (tabsContainer.children.length - 1).toString();

    const faviconContainer: HTMLElement = document.createElement("div");
    faviconContainer.className = "favicon";

    const faviconImg: HTMLImageElement = document.createElement("img");
    faviconImg.style.width = "15px";
    faviconImg.style.marginTop = "1px";
    faviconImg.style.marginRight = "6px";
    faviconImg.style.backgroundColor = "#ffffff";
    faviconImg.style.borderRadius = "50%";
    faviconImg.style.boxShadow = "0 0 3px 1px rgba(255, 255, 255, 0.8)";
    faviconContainer.appendChild(faviconImg);

    const tabTitle: HTMLElement = document.createElement("span");
    tabTitle.textContent = title;
    tabTitle.style.flex = "1";

    const closeButton: HTMLElement = document.createElement("button");
    closeButton.textContent = "✕";
    closeButton.className = "close-button";
    closeButton.addEventListener("click", (e)=> {
        e.stopPropagation();
        closeTab(tab);

        if(tabsContainer.querySelectorAll(".tab").length === 0)
            window.close();
    });

    tab.appendChild(faviconContainer);
    tab.appendChild(tabTitle);
    tab.appendChild(closeButton);
    tab.addEventListener("click", ()=> switchTab(tab));
    tabsContainer.insertBefore(tab, document.getElementById("new-tab-button"));

    tab.addEventListener("mousedown", (e) => {
        if(e.button === 1) {
            e.preventDefault();
            closeTab(tab);

            if(tabsContainer.querySelectorAll(".tab").length === 0)
                window.close();
        }
    });

    const webviewWrapper: HTMLElement = document.createElement("div");
    webviewWrapper.className = "webview-wrapper";
    webviewWrapper.dataset.index = (tabsContainer.children.length - 2).toString();

    const webview: WebviewTag = document.createElement("webview");
    webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36');
    webview.src = url;

    webview.addEventListener("did-start-loading", () => {
        faviconImg.src = "assets/loading.gif";
    });

    webview.addEventListener("did-stop-loading", async ()=> {
        const webviewTitle = webview.getTitle()
        tabTitle.textContent = webviewTitle.substring(0, 40) + (webviewTitle.length > 40 ? "..." : "");
        tabTitle.setAttribute("title", webviewTitle);

        const faviconSrc: string = await fetchFavicon(urlInput.value);
        faviconImg.src = faviconSrc;

        if(tab.classList.contains("active"))
            urlInput.value = webview.getURL();
    });

    webview.addEventListener("page-title-updated", async (e)=> {
        tabTitle.textContent = e.title.substring(0, 40) + (e.title.length > 40 ? "..." : "");
        tabTitle.setAttribute("title", e.title);
    });

    webviewWrapper.appendChild(webview);
    webviewContainer.appendChild(webviewWrapper);

    tab.addEventListener("dragstart", (e: DragEvent): any => {
        if(e.dataTransfer != null && tab.dataset.index !== undefined)
            e.dataTransfer.setData("text/plain", tab.dataset.index.toString());
        tab.classList.add("dragging");
    });

    tab.addEventListener("dragend", ()=> {
        tab.classList.remove("dragging");
    });

    tabsContainer.addEventListener("dragover", (e)=> {
        e.preventDefault();

        const draggingTab: HTMLElement = document.querySelector(".tab.dragging") as HTMLElement;
        const target = e.target as HTMLElement;
        if(target.classList.contains("tab") && target !== draggingTab) {
            const rect = target.getBoundingClientRect();
            const middle: number = rect.top + rect.height / 2;
            const after: boolean = e.clientY > middle;

            tabsContainer.insertBefore(draggingTab, after && (target.nextSibling as ChildNode) || target);
        }
    });

    switchTab(tab);
}

function switchTab(tab: HTMLElement): void {
    const activeTab: HTMLElement = tabsContainer.querySelector(".tab.active") as HTMLElement;
    const activeWebview: HTMLElement = webviewContainer.querySelector(".webview-wrapper:not([style*='display: none'])") as HTMLElement;

    if(activeTab)
        activeTab.classList.remove("active");

    if(activeWebview)
        activeWebview.style.display = "none";
    tab.classList.add("active");

    const index: string = tab.dataset.index as string;
    const webviewToShow: HTMLElement = webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"]`) as HTMLElement;

    if(webviewToShow)
        webviewToShow.style.display = "flex";
    urlInput.value = tab.dataset.url as string;
}

function closeTab(tab: HTMLElement): void {
    const index: string = tab.dataset.index as string;
    const webviewWrapper: HTMLElement = webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"]`) as HTMLElement;

    tab.classList.add("closing");
    if(webviewWrapper)
        webviewWrapper.classList.add("closing");

    setTimeout(()=> {
        tab.remove();
        if(webviewWrapper)
            webviewWrapper.remove();

        const tabs: NodeListOf<HTMLElement> = tabsContainer.querySelectorAll(".tab");
        if(tabs.length > 0) {
            const idx: number = parseInt(index);
            const newIndex: number = idx > 0 ? idx - 1 : 0;
            const newTab: HTMLElement = tabs[newIndex];

            switchTab(newTab);
        }
        else window.close();
    }, 300);
}

goButton.addEventListener("click", ()=> {
    const url: string = ensureHttps(urlInput.value);
    const activeTab: HTMLElement = tabsContainer.querySelector(".tab.active") as HTMLElement;

    if(activeTab) {
        activeTab.dataset.url = url;

        const index: string = activeTab.dataset.index as string;
        const webviewToUpdate: WebviewTag = webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"] webview`) as WebviewTag;

        if(webviewToUpdate)
            webviewToUpdate.src = url;
    }
    else createTab(url, new URL(url).hostname);
});

urlInput.addEventListener("keypress", (e)=> {
    if(e.key === "Enter") {
        urlInput.value = ensureHttps(urlInput.value);
        urlInput.blur();

        goButton.click();
    }
});

(document.getElementById("new-tab-button") as HTMLElement).addEventListener("click", ()=> {
    createTab("about:blank", "New Tab");
});

document.addEventListener("keydown", (e)=> {
    if(e.ctrlKey && e.key === "w") {
        e.preventDefault();

        const activeTab: HTMLElement = tabsContainer.querySelector(".tab.active") as HTMLElement;
        if(activeTab)
            closeTab(activeTab);

        if(tabsContainer.querySelectorAll(".tab").length === 0)
            window.close();
    }
    else if(e.ctrlKey && e.key === "t") {
        e.preventDefault();
        createTab("about:blank", "New Tab");
    }
    else if(e.ctrlKey && !e.shiftKey && !e.altKey) {
        const index: number = parseInt(e.key) - 1;

        if(index >= 0 && index < tabsContainer.children.length - 1) {
            const tabs: NodeListOf<HTMLElement> = tabsContainer.querySelectorAll(".tab");
            const tabToSwitch: HTMLElement = tabs[index];

            if(tabToSwitch)
                switchTab(tabToSwitch);
        }
    }
    else if(e.key === "F6") {
        e.preventDefault();
        urlInput.focus();
    }
});

(async ()=> {
    try {
        const ipFetch: Response = await fetch("https://api.country.is/");
        const ipData: any = await ipFetch.json();

        ipAddressElement.textContent = ipData.ip;
    }
    catch(error) {
        ipAddressElement.textContent = "Error fetching IP";
    }
})();

createTab("http://haystak5njsmn2hqkewecpaxetahtwhsbsa64jom2k22z5afxhnpxfid.onion/", "Haystak");