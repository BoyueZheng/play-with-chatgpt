// ==UserScript==
// @name         BrowserGPT
// @version      1.0
// @description  Enhance browser with ChatGPT
// @match        *://*/*
// @connect            chat.openai.com
// @grant              GM_addStyle
// @grant              GM_deleteValue
// @grant              GM_getValue
// @grant              GM_info
// @grant              GM_registerMenuCommand
// @grant              GM_setValue
// @grant              GM_unregisterMenuCommand
// @grant              GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==




const customActions = [
    {
        name: 'Summarize',
        promote: (text) => "Summarize: " + text,
    },
    {
        name: 'Bullet points',
        promote: (text) => "Extract into bullet points: " + text,
    },
    {
        name: 'Reply',
        promote: (text) => "Write a reply: " + text,
    },
    {
        name: 'Visual Aids',
        promote: (text) => "Bold odd-numbered word's odd-numbered letters and output in HTML format: " + text,
    },
];


(e => { const t = document.createElement("style"); t.dataset.source = "vite-plugin-monkey", t.innerText = e, document.head.appendChild(t) })(".chat-gpt-container{border-radius:8px;border:1px solid #dadce0;padding:15px;flex-basis:0;flex-grow:1;word-wrap:break-word;white-space:pre-wrap}.chat-gpt-container p{margin:0}.chat-gpt-container .prefix{font-weight:700}.chat-gpt-container .loading{color:#b6b8ba;animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}@keyframes pulse{0%,to{opacity:1}50%{opacity:.5}}.chat-gpt-container.sidebar-free{margin-left:60px;height:fit-content}.chat-gpt-container pre{white-space:pre-wrap;min-width:0;margin-bottom:0;line-height:20px}.chat-gpt-translate-button{border-radius:8px;border:1px solid #dadce0;padding:5px}.chat-gpt-translate-button:hover{color:#006494;transition:color .1s ease-out}.chat-gpt-translate-button[disabled]{color:#eee}");

(function () {

    'use strict';
    if (window !== window.top) {
        return;
    }

    let lastSelection;
    // TODO summarize and display selected content using chatgpt
    // Create the custom context menu element
    const contextMenu = document.createElement('div');
    contextMenu.classList.add('custom-context-menu');

    for (const customAction of customActions) {
        const customMenuItem = document.createElement('div');
        customMenuItem.classList.add('custom-context-menu-item');
        customMenuItem.textContent = customAction.name;

        // Add a click event listener to the custom menu item
        customMenuItem.addEventListener('click', function () {
            getContainer().querySelector('.prefix').textContent = customAction.name;
            getAnswer(customAction.promote(lastSelection));
            contextMenu.style.display = 'none';
        });

        // Add the custom menu item to the context menu
        contextMenu.appendChild(customMenuItem);
    }
    // Create the custom menu item element


    // Add the context menu to the body element
    document.body.appendChild(contextMenu);

    // Add a contextmenu event listener to the body element
    document.addEventListener('contextmenu', function (e) {
        lastSelection = window.getSelection().toString();
        if (lastSelection) {
            e.preventDefault();
        }
        contextMenu.style.display = 'block';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.style.left = e.pageX + 'px';
    });

    // Add a click event listener to the body element to hide the context menu
    document.addEventListener('click', function () {
        contextMenu.style.display = 'none';
    });

    // Add the CSS for the custom context menu and menu item
    var styles = `
        .custom-context-menu {
            position: absolute;
            background-color: inherit;
            border: 1px solid gray;
            padding: 4px;
            z-index: 9999;
            display: none;
        }

        .custom-context-menu-item {
            padding: 4px;
            cursor: pointer;
        }

        .gpt-container {

        }
    `;

    var styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerHTML = styles;
    document.head.appendChild(styleSheet);



    // ----- Chatgpt shit -----


    const container = document.createElement("div");
    const p = document.createElement("p");
    container.appendChild(p);
    initContainer();


    // methods
    function uuidv4() {
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 16), 1);
        }
        s[14] = "4";
        s[19] = hexDigits.substr(s[19] & 3 | 8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";
        var uuid = s.join("");
        return uuid;
    }
    function getUserscriptManager() {
        try {
            const userscriptManager = GM_info.scriptHandler;
            return userscriptManager;
        } catch (error) {
            return "other";
        }
    }


    // Function to calculate the luminance of a color
    function calculateLuminance(color) {
        const rgb = color.match(/\d+/g);
        const r = rgb[0] / 255;
        const g = rgb[1] / 255;
        const b = rgb[2] / 255;
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luminance;
    }
    function getContrastColor(bgColors, textColorLuminance) {
        let bestBgColor;
        let bestContrast = 0;

        for (const bgColor of bgColors) {
            // Calculate the relative luminance of the background color
            const bgLuminance = calculateLuminance(bgColor);

            // Calculate the contrast ratio
            const contrastRatio = (Math.max(bgLuminance, textColorLuminance) + 0.05) / (Math.min(bgLuminance, textColorLuminance) + 0.05);

            // If the contrast ratio is greater than the current best contrast, update the best contrast and best background color
            if (contrastRatio > bestContrast) {
                bestContrast = contrastRatio;
                bestBgColor = bgColor;
            }
        }

        return bestBgColor;
    }

    function generateBgColors(numColors) {
        const colors = [];
        const step = Math.floor(255 / (numColors - 1));
        for (let i = 0; i < numColors; i++) {
            const r = step * i;
            const g = step * i;
            const b = step * i;
            const color = `rgb(${r},${g},${b})`;
            colors.push(color);
        }
        return colors;
    }
    function getContainer() {
        return container;
    }
    function setContainerContent(content) {
        p.innerHTML = `<span class="prefix">ChatGPT</span>${content}`;
    }
    function initContainer() {
        document.body.appendChild(container);
        let textColor = getComputedStyle(container).color;
        let textContainer = container;
        while (!textColor) {
            textContainer = textContainer.parentElement;
            textColor = getComputedStyle(textContainer).color;
        }

        // Calculate the luminance of the text color
        const luminance = calculateLuminance(textColor);

        // Set the background color to white or black depending on the luminance
        const bgColors = generateBgColors(10);
        const bgColor = getContrastColor(bgColors, luminance);
        container.style.backgroundColor = bgColor;
        contextMenu.style.backgroundColor = bgColor;
        container.style.position = 'fixed';
        container.style.bottom = '0';
        container.style.left = '0';
        container.style.right = '0';
        container.style.margin = '12px';
        container.style.zIndex = '999';
        //container2.style.height = 'fit-content';
        GM_addStyle(".chat-gpt-container{max-width: 100%!important}");
        container.className = "chat-gpt-container";
        container.style.display = 'none';
        setContainerContent('<div></div>');
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&#10006;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '0';
        closeButton.style.right = '0';
        closeButton.style.fontSize = '20px';
        closeButton.style.border = 'none';
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.cursor = 'pointer';

        // add event listener to the close button
        closeButton.addEventListener('click', () => {
            container.style.display = 'none';
        });

        // append the close button to the container
        container.appendChild(closeButton);
    }
    function containerShow(answer) {
        const container2 = getContainer();
        container2.querySelector("div").innerHTML = answer;
        container2.style.display = 'inherit';
    }
    function containerAlert(htmlStr) {
        const container2 = getContainer();
        setContainerContent(htmlStr);
        container2.style.display = 'inherit';
    }
    function alertLogin() {
        containerAlert(`<p>${"login"}<a href="https://chat.openai.com" target="_blank" rel="noreferrer">chat.openai.com</a></p>`);
    }
    function alertBlockedByCloudflare() {
        containerAlert(`<p>${"checkClouflare"}<a href="https://chat.openai.com" target="_blank" rel="noreferrer">chat.openai.com</a></p>`);
    }
    function alertFrequentRequests() {
        containerAlert(`<p>${"tooManyRequests"}</p>`);
    }
    function isBlockedbyCloudflare(resp) {
        try {
            const html = new DOMParser().parseFromString(resp, "text/html");
            const title = html.querySelector("title");
            return title.innerText === "Just a moment...";
        } catch (error) {
            return false;
        }
    }

    async function getAnswer(question, callback) {
        try {
            const accessToken = await getAccessToken();
            const nextID = uuidv4();
            const parentID = GM_getValue('parentID') ?? uuidv4();
            const conversationID = GM_getValue('conversationID');
            const nextData = {
                action: "next",
                // conversation_id: "ca17ba9b-aca3-4747-9383-b84768b3d101",
                messages: [
                    {
                        id: nextID,
                        role: "user",
                        content: {
                            content_type: "text",
                            parts: [question]
                        }
                    }
                ],
                model: "text-davinci-002-render",
                parent_message_id: parentID ?? uuidv4(),
            };
            if (conversationID != null) { nextData.conversation_id = conversationID; }
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://chat.openai.com/backend-api/conversation",
                headers: {
                    "Content-Type": "	application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                responseType: responseType(),
                data: JSON.stringify(nextData),
                onloadstart: onloadstart(),
                onload: onload(),
                onerror: function (event) {
                    console.error("getAnswer error: ", event);
                },
                ontimeout: function (event) {
                    console.error("getAnswer timeout: ", event);
                }
            });
        } catch (error) {
            if (error === "UNAUTHORIZED") {
                removeAccessToken();
                alertLogin();
            }
            console.error("getAnswer error: ", error);
        }
        function responseType() {
            if (getUserscriptManager() === "Tampermonkey") {
                return "stream";
            } else {
                return "text";
            }
        }
        function onload(data) {
            console.log('data', data);
            function finish() {
                if (typeof callback === "function") {
                    return callback("finish");
                }
            }
            finish();
            return function (event) {
                if (event.status === 401) {
                    removeAccessToken();
                    alertLogin();
                }
                if (event.status === 403) {
                    alertBlockedByCloudflare();
                }
                if (event.status === 429) {
                    alertFrequentRequests();
                }
                if (getUserscriptManager() !== "Tampermonkey") {
                    if (event.response) {
                        const answer = JSON.parse(event.response.split("\n\n").slice(-3, -2)[0].slice(6)).message.content.parts[0];
                        containerShow(answer);
                    }
                }
            };
        }
        function onloadstart() {
            if (getUserscriptManager() === "Tampermonkey") {
                return function (stream) {
                    const reader = stream.response.getReader();
                    reader.read().then(function processText({ done, value }) {

                        if (done) {
                            return;
                        }
                        let responseItem = String.fromCharCode(...Array.from(value));
                        const items = responseItem.split("\n\n");
                        if (items.length > 2) {
                            const lastItem = items.slice(-3, -2)[0];
                            if (lastItem.startsWith("data: [DONE]")) {
                                responseItem = items.slice(-4, -3)[0];
                            } else {
                                responseItem = lastItem;
                            }
                        }
                        if (responseItem.startsWith("data: {")) {
                            try {
                                const resp = JSON.parse(responseItem.slice(6));
                                GM_setValue('conversationID', resp.conversation_id);
                                GM_setValue('parentID', resp.message.id);
                                const answer = resp.message.content.parts[0];
                                containerShow(answer);
                            } catch (ex) {
                                console.error(ex, responseItem);
                            }
                        } else if (responseItem.startsWith("data: [DONE]")) {
                            return;
                        }
                        return reader.read().then(processText);
                    });
                };
            }
        }
    }
    function removeAccessToken() {
        GM_deleteValue("accessToken");
    }
    function getAccessToken() {
        return new Promise(async (resolve, rejcet) => {
            const accessToken = await GM_getValue("accessToken");
            if (!accessToken) {
                GM_xmlhttpRequest({
                    url: "https://chat.openai.com/api/auth/session",
                    onload: function (response) {
                        if (isBlockedbyCloudflare(response.responseText)) {
                            alertLogin();
                            return;
                        }
                        const accessToken2 = JSON.parse(response.responseText).accessToken;
                        if (!accessToken2) {
                            rejcet("UNAUTHORIZED");
                        }
                        GM_setValue("accessToken", accessToken2);
                        resolve(accessToken2);
                    },
                    onerror: function (error) {
                        rejcet(error);
                    },
                    ontimeout: () => {
                        console.error("getAccessToken timeout!");
                    }
                });
            } else {
                resolve(accessToken);
            }
        });
    }
})();
