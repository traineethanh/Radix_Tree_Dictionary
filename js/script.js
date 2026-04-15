// ==========================================
// 1. KHAI BÁO CÁC PHẦN TỬ GIAO DIỆN
// ==========================================
const searchform = document.getElementById('searchform');
const searchinput = document.getElementById('searchinput');
const resultsel = document.getElementById('results');

const addform = document.getElementById('addform');
const addwordinput = document.getElementById('addwordinput');
const addmeaninginput = document.getElementById('addmeaninginput');

const delform = document.getElementById('delform');
const delwordinput = document.getElementById('delwordinput');

const triecontainer = document.getElementById('trie-visualizer');

// ==========================================
// 2. CẤU TRÚC LỚP RADIX TRIE
// ==========================================
class radixnode {
    constructor() {
        this.id = 'node-' + Math.random().toString(36).substring(2, 9);
        this.edges = {};
        this.isend = false;
        this.meaning = "";
    }
}

class radixtrie {
    constructor() {
        this.root = new radixnode();
    }

    insert(word, meaning) {
        let node = this.root;
        let currentword = word.toLowerCase();

        while (currentword.length > 0) {
            let matchfound = false;
            for (let edge in node.edges) {
                let commonlen = 0;
                while (commonlen < edge.length && commonlen < currentword.length && edge[commonlen] === currentword[commonlen]) {
                    commonlen++;
                }

                if (commonlen > 0) {
                    matchfound = true;
                    if (commonlen === edge.length) {
                        node = node.edges[edge];
                        currentword = currentword.substring(commonlen);
                    } else {
                        let splitnode = new radixnode();
                        let remedge = edge.substring(commonlen);
                        let remword = currentword.substring(commonlen);

                        splitnode.edges[remedge] = node.edges[edge];
                        delete node.edges[edge];
                        node.edges[edge.substring(0, commonlen)] = splitnode;

                        if (remword.length === 0) {
                            splitnode.isend = true;
                            splitnode.meaning = meaning;
                        } else {
                            let newnode = new radixnode();
                            newnode.isend = true;
                            newnode.meaning = meaning;
                            splitnode.edges[remword] = newnode;
                        }
                    }
                    break;
                }
            }
            if (!matchfound) {
                let newnode = new radixnode();
                newnode.isend = true;
                newnode.meaning = meaning;
                node.edges[currentword] = newnode;
                break;
            }
        }
        
        if (currentword.length === 0) {
             node.isend = true;
             node.meaning = meaning;
        }
        this.render();
    }

    search(word) {
        let node = this.root;
        let currentword = word.toLowerCase();

        while (currentword.length > 0) {
            let matchfound = false;
            for (let edge in node.edges) {
                if (currentword.startsWith(edge)) {
                    node = node.edges[edge];
                    currentword = currentword.substring(edge.length);
                    matchfound = true;
                    break;
                }
            }
            if (!matchfound) return null;
        }
        return node.isend ? node : null;
    }

    delete(word) {
        let node = this.root;
        let currentword = word.toLowerCase();

        while (currentword.length > 0) {
            let matchfound = false;
            for (let edge in node.edges) {
                if (currentword.startsWith(edge)) {
                    node = node.edges[edge];
                    currentword = currentword.substring(edge.length);
                    matchfound = true;
                    break;
                }
            }
            if (!matchfound) return false;
        }

        if (node.isend) {
            node.isend = false;
            node.meaning = "";
            this.render();
            return true;
        }
        return false;
    }

    render() {
        const container = document.getElementById('trie-visualizer');
        
        container.innerHTML = `
            <div id="trie-canvas">
                <svg id="trie-svg"></svg>
                <div id="html-tree"></div>
            </div>
        `;
        
        const htmlTree = document.getElementById('html-tree');
        
        const buildHTML = (node, edgeLabel) => {
            if (!node.id) node.id = 'node-' + Math.random().toString(36).substr(2, 9);
            
            let html = `<div class="tree-node-wrapper">`;
            
            if (edgeLabel !== null) {
                html += `<div class="edge-label">${edgeLabel}</div>`;
            }
            
            let isEndClass = node.isend ? "is-end" : "";
            let displayChar = edgeLabel === null ? "R" : "";
            html += `<div id="${node.id}" class="node-circle ${isEndClass}">${displayChar}</div>`;

            let childrenKeys = Object.keys(node.edges);
            if (childrenKeys.length > 0) {
                html += `<div class="tree-children">`;
                for (let key of childrenKeys) {
                    html += buildHTML(node.edges[key], key);
                }
                html += `</div>`;
            }
            html += `</div>`;
            return html;
        };
        
        htmlTree.innerHTML = buildHTML(this.root, null);
        setTimeout(() => this.drawEdges(), 50);
    }

    drawEdges() {
        const svg = document.getElementById('trie-svg');
        const canvas = document.getElementById('trie-canvas');
        if (!svg || !canvas) return;
        
        const fullWidth = canvas.scrollWidth;
        const fullHeight = canvas.scrollHeight;

        svg.setAttribute('width', canvas.scrollWidth);
        svg.setAttribute('height', canvas.scrollHeight);
        svg.style.width = fullWidth + "px";
        svg.style.height = fullHeight + "px";
        svg.innerHTML = ''; 
        
        const drawLine = (parentNode) => {
            const parentEl = document.getElementById(parentNode.id);
            if (!parentEl) return;
            
            const pRect = parentEl.getBoundingClientRect();
            const cRect = canvas.getBoundingClientRect();

            const pX = pRect.left - cRect.left + pRect.width / 2;
            const pY = pRect.top - cRect.top + pRect.height / 2;

            Object.values(parentNode.edges).forEach(childNode => {
                const childEl = document.getElementById(childNode.id);
                if (!childEl) return;
                
                const chRect = childEl.getBoundingClientRect();

                const cX = chRect.left - cRect.left + chRect.width / 2;
                const cY = chRect.top - cRect.top + chRect.height / 2;

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", pX);
                line.setAttribute("y1", pY);
                line.setAttribute("x2", cX);
                line.setAttribute("y2", cY);
                line.setAttribute("stroke", "#a78bfa"); 
                line.setAttribute("stroke-width", "3");
                svg.appendChild(line);

                drawLine(childNode);
            });
        };
        
        drawLine(this.root);
    }

    focusNode(nodeId) {
        const nodeEl = document.getElementById(nodeId);
        if (!nodeEl) return;
    
        // 1. Cuộn mượt mà đến node đó
        nodeEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    
        // 2. Thêm hiệu ứng Highlight
        nodeEl.classList.add('highlight-focus');
        
        // Xóa class sau 2 giây để có thể thực hiện lại lần sau
        setTimeout(() => {
            nodeEl.classList.remove('highlight-focus');
        }, 2000);
    }
}

// ==========================================
// 3. KHỞI TẠO BIẾN TOÀN CỤC & DỮ LIỆU
// ==========================================
const storageKey = 'lexicon_data';
const mytrie = new radixtrie(); // Khai báo cây trước khi gọi initApp
let dictionaryData = [];

function saveDictionaryData(dataArray) {
    localStorage.setItem(storageKey, JSON.stringify(dataArray));
}

// Hàm khởi tạo ứng dụng (Tự động nạp dữ liệu)
async function initApp() {
    const rawData = localStorage.getItem(storageKey);
    
    if (rawData) {
        dictionaryData = JSON.parse(rawData);
    } else {
        try {
            const response = await fetch('./data/lexicon_data.json');
            if (response.ok) {
                dictionaryData = await response.json();
                saveDictionaryData(dictionaryData);
                console.log("Đã tự động tải dữ liệu gốc từ file JSON.");
            } else {
                throw new Error("Không lấy được dữ liệu từ file");
            }
        } catch (error) {
            console.warn("Không tìm thấy file JSON. Khởi tạo bằng mảng trống.");
            dictionaryData = []; 
        }
    }

    // Đổ dữ liệu vào cây để hiển thị
    dictionaryData.forEach(item => {
        if(item.word && item.meaning) mytrie.insert(item.word, item.meaning);
    });
}

// Khởi chạy ứng dụng
initApp();

// ==========================================
// 4. CÁC SỰ KIỆN GIAO DIỆN (TÌM, THÊM, XÓA)
// ==========================================
searchform.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = searchinput.value.trim();
    if (!word) return;
    
    const result = mytrie.search(word);
    resultsel.classList.remove('hidden');
    
    if (result) {
        resultsel.innerHTML = `
        <div class="word-card">
            <h2>${word}</h2>
            <div class="definition">
                <p class="definition-text">${result.meaning}</p>
            </div>
        </div>`;
        mytrie.focusNode(result.id);
    } else {
        resultsel.innerHTML = `<div class="error">The word "${word}" does not exist in the index.</div>`;
    }
});

addform.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = addwordinput.value.trim();
    const meaning = addmeaninginput.value.trim();
    if (word && meaning) {
        mytrie.insert(word, meaning);
        
        const existingIndex = dictionaryData.findIndex(item => item.word.toLowerCase() === word.toLowerCase());
        if (existingIndex >= 0) {
            dictionaryData[existingIndex].meaning = meaning;
        } else {
            dictionaryData.push({ word: word, meaning: meaning });
        }
        
        saveDictionaryData(dictionaryData);
        
        addwordinput.value = '';
        addmeaninginput.value = '';
    }
    const newNode = mytrie.search(word);
    if (newNode) {
        setTimeout(() => mytrie.focusNode(newNode.id), 100); // Đợi render xong rồi focus
    }
});

delform.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = delwordinput.value.trim();
    if (word) {
        let success = mytrie.delete(word);
        
        if(!success) {
            alert(`Could not find the word "${word}" to delete.`);
        } else {
            dictionaryData = dictionaryData.filter(item => item.word.toLowerCase() !== word.toLowerCase());
            saveDictionaryData(dictionaryData);
        }
        delwordinput.value = '';
    }
});

// ==========================================
// 5. TÍNH NĂNG XUẤT / NHẬP FILE .JSON
// ==========================================
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(dictionaryData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = "lexicon_data.json";
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                
                if (Array.isArray(importedData)) {
                    dictionaryData = importedData;
                    saveDictionaryData(dictionaryData);

                    mytrie.root = new radixnode(); 
                    
                    dictionaryData.forEach(item => {
                        if (item.word && item.meaning) {
                            mytrie.insert(item.word, item.meaning);
                        }
                    });
                    
                    alert("Import successful! The Radix Trie has been updated.");
                } else {
                    alert("Invalid JSON format. The file must contain an array of objects.");
                }
            } catch (err) {
                alert("Error reading JSON file: " + err.message);
            }
        };
        
        reader.readAsText(file);
        fileInput.value = ''; 
    });
}