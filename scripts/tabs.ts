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
import { Util } from "./util";

export class Tab {
    static create(url: string, title: string): void {
        const tab: HTMLElement = document.createElement("div");
        tab.className = "tab";
        tab.draggable = true;
        tab.dataset.url = url;
        tab.dataset.index = (UI.tabsContainer.children.length - 1).toString();
    
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
            Tab.close(tab);
    
            if(UI.tabsContainer.querySelectorAll(".tab").length === 0)
                window.close();
        });
    
        tab.appendChild(faviconContainer);
        tab.appendChild(tabTitle);
        tab.appendChild(closeButton);
        tab.addEventListener("click", ()=> Tab.switch(tab));
        UI.tabsContainer.insertBefore(tab, document.getElementById("new-tab-button"));
    
        tab.addEventListener("mousedown", (e) => {
            if(e.button === 1) {
                e.preventDefault();
                Tab.close(tab);
    
                if(UI.tabsContainer.querySelectorAll(".tab").length === 0)
                    window.close();
            }
        });
    
        const webviewWrapper: HTMLElement = document.createElement("div");
        webviewWrapper.className = "webview-wrapper";
        webviewWrapper.dataset.index = (UI.tabsContainer.children.length - 2).toString();
    
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
    
            const faviconSrc: string = await Util.fetchFavicon(UI.urlInput.value);
            faviconImg.src = faviconSrc;
    
            if(tab.classList.contains("active"))
                UI.urlInput.value = webview.getURL();
        });
    
        webview.addEventListener("page-title-updated", async (e)=> {
            tabTitle.textContent = e.title.substring(0, 40) + (e.title.length > 40 ? "..." : "");
            tabTitle.setAttribute("title", e.title);
        });
    
        webviewWrapper.appendChild(webview);
        UI.webviewContainer.appendChild(webviewWrapper);
    
        tab.addEventListener("dragstart", (e: DragEvent): any => {
            if(e.dataTransfer != null && tab.dataset.index !== undefined)
                e.dataTransfer.setData("text/plain", tab.dataset.index.toString());
            tab.classList.add("dragging");
        });
    
        tab.addEventListener("dragend", ()=> {
            tab.classList.remove("dragging");
        });
    
        UI.tabsContainer.addEventListener("dragover", (e)=> {
            e.preventDefault();
    
            const draggingTab: HTMLElement = document.querySelector(".tab.dragging") as HTMLElement;
            const target = e.target as HTMLElement;
            if(target.classList.contains("tab") && target !== draggingTab) {
                const rect = target.getBoundingClientRect();
                const middle: number = rect.top + rect.height / 2;
                const after: boolean = e.clientY > middle;
    
                UI.tabsContainer.insertBefore(draggingTab, after && (target.nextSibling as ChildNode) || target);
            }
        });
    
        Tab.switch(tab);
    }

    static switch(tab: HTMLElement): void {
        const activeTab: HTMLElement = UI.tabsContainer.querySelector(".tab.active") as HTMLElement;
        const activeWebview: HTMLElement = UI.webviewContainer.querySelector(".webview-wrapper:not([style*='display: none'])") as HTMLElement;
    
        if(activeTab)
            activeTab.classList.remove("active");
    
        if(activeWebview)
            activeWebview.style.display = "none";
        tab.classList.add("active");
    
        const index: string = tab.dataset.index as string;
        const webviewToShow: HTMLElement = UI.webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"]`) as HTMLElement;
    
        if(webviewToShow)
            webviewToShow.style.display = "flex";
        UI.urlInput.value = tab.dataset.url as string;
    }
    
    static close(tab: HTMLElement): void {
        const index: string = tab.dataset.index as string;
        const webviewWrapper: HTMLElement = UI.webviewContainer.querySelector(`.webview-wrapper[data-index="${index}"]`) as HTMLElement;
    
        tab.classList.add("closing");
        if(webviewWrapper)
            webviewWrapper.classList.add("closing");
    
        setTimeout(()=> {
            tab.remove();
            if(webviewWrapper)
                webviewWrapper.remove();
    
            const tabs: NodeListOf<HTMLElement> = UI.tabsContainer.querySelectorAll(".tab");
            if(tabs.length > 0) {
                const idx: number = parseInt(index);
                const newIndex: number = idx > 0 ? idx - 1 : 0;
                const newTab: HTMLElement = tabs[newIndex];
    
                Tab.switch(newTab);
            }
            else window.close();
        }, 300);
    }
}