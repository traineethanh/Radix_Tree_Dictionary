/* ═══════════════════════════════════════════════
   RADIX TRIE IMPLEMENTATION
═══════════════════════════════════════════════ */
class RadixTrieNode {
    constructor() {
      this.children = {};   // key: edge label (string), value: RadixTrieNode
      this.isEnd = false;
      this.wordKey = null;  // the full word if isEnd
    }
  }
  
  class RadixTrie {
    constructor() {
      this.root = new RadixTrieNode();
      this.nodeCount = 1;
    }
  
    // Find common prefix length
    _commonPrefix(a, b) {
      let i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      return i;
    }
  
    insert(word) {
      const key = word.toLowerCase();
      let node = this.root;
      let remaining = key;
  
      while (remaining.length > 0) {
        let matched = false;
        for (let edge in node.children) {
          const cp = this._commonPrefix(remaining, edge);
          if (cp === 0) continue;
  
          if (cp === edge.length) {
            // Full edge match — descend
            node = node.children[edge];
            remaining = remaining.slice(cp);
            matched = true;
            break;
          } else {
            // Partial match — split node
            const sharedEdge = edge.slice(0, cp);
            const oldSuffix = edge.slice(cp);
            const newSuffix = remaining.slice(cp);
  
            const oldChild = node.children[edge];
            delete node.children[edge];
  
            const splitNode = new RadixTrieNode();
            this.nodeCount++;
            node.children[sharedEdge] = splitNode;
            splitNode.children[oldSuffix] = oldChild;
  
            if (newSuffix.length === 0) {
              splitNode.isEnd = true;
              splitNode.wordKey = key;
            } else {
              const newLeaf = new RadixTrieNode();
              this.nodeCount++;
              newLeaf.isEnd = true;
              newLeaf.wordKey = key;
              splitNode.children[newSuffix] = newLeaf;
            }
            return true;
          }
        }
        if (!matched) {
          const leaf = new RadixTrieNode();
          this.nodeCount++;
          leaf.isEnd = true;
          leaf.wordKey = key;
          node.children[remaining] = leaf;
          remaining = '';
        }
      }
      if (!node.isEnd) {
        node.isEnd = true;
        node.wordKey = key;
        return true;
      }
      return false; // already exists
    }
  
    search(word) {
      const key = word.toLowerCase();
      let node = this.root;
      let remaining = key;
      while (remaining.length > 0) {
        let matched = false;
        for (let edge in node.children) {
          if (remaining.startsWith(edge)) {
            node = node.children[edge];
            remaining = remaining.slice(edge.length);
            matched = true;
            break;
          }
        }
        if (!matched) return null;
      }
      return node.isEnd ? node : null;
    }
  
    delete(word) {
      const key = word.toLowerCase();
      const path = []; // [{node, edge, parent}]
      let node = this.root;
      let remaining = key;
  
      while (remaining.length > 0) {
        let matched = false;
        for (let edge in node.children) {
          if (remaining.startsWith(edge)) {
            path.push({ parent: node, edge, child: node.children[edge] });
            node = node.children[edge];
            remaining = remaining.slice(edge.length);
            matched = true;
            break;
          }
        }
        if (!matched) return false;
      }
      if (!node.isEnd) return false;
  
      node.isEnd = false;
      node.wordKey = null;
  
      // Collapse nodes
      if (Object.keys(node.children).length === 0 && path.length > 0) {
        const { parent, edge } = path[path.length - 1];
        delete parent.children[edge];
        this.nodeCount--;
  
        // If parent now has 1 child and is not end, merge
        if (path.length >= 2) {
          const grandparent = path[path.length - 2];
          const parentNode = grandparent.child;
          const parentEdge = grandparent.edge;
          const parentKeys = Object.keys(parentNode.children);
          if (parentKeys.length === 1 && !parentNode.isEnd) {
            const onlyEdge = parentKeys[0];
            const onlyChild = parentNode.children[onlyEdge];
            delete grandparent.parent.children[parentEdge];
            grandparent.parent.children[parentEdge + onlyEdge] = onlyChild;
            this.nodeCount--;
          }
        }
      }
      return true;
    }
  
    // Collect all words with prefix
    autocomplete(prefix) {
      const key = prefix.toLowerCase();
      let node = this.root;
      let remaining = key;
      while (remaining.length > 0) {
        let matched = false;
        for (let edge in node.children) {
          if (remaining.startsWith(edge)) {
            node = node.children[edge];
            remaining = remaining.slice(edge.length);
            matched = true;
            break;
          }
          if (edge.startsWith(remaining)) {
            node = node.children[edge];
            remaining = '';
            matched = true;
            break;
          }
        }
        if (!matched) return [];
      }
      const results = [];
      this._collect(node, results);
      return results;
    }
  
    _collect(node, results) {
      if (node.isEnd) results.push(node.wordKey);
      for (let edge in node.children) this._collect(node.children[edge], results);
    }
  
    // Get tree structure for visualization
    getTree() {
      return { label: 'ROOT', node: this.root };
    }
  }
  
  /* ═══════════════════════════════════════════════
     APP STATE
  ═══════════════════════════════════════════════ */
  const trie = new RadixTrie();
  const dictionary = {};  // word → {phonetic, pos, definition, example}
  let opCount = 0;
  let currentWord = null;
  
  // Pre-load sample words
  const sampleWords = [
    { word: 'ephemeral', phonetic: '/ɪˈfem.ər.əl/', pos: 'adjective',
      definition: 'Lasting for a very short time; transitory.',
      example: 'The ephemeral beauty of cherry blossoms draws millions of visitors.' },
    { word: 'eloquent', phonetic: '/ˈel.ə.kwənt/', pos: 'adjective',
      definition: 'Fluent or persuasive in speaking or writing.',
      example: 'She gave an eloquent speech that moved the entire audience.' },
    { word: 'serendipity', phonetic: '/ˌser.ənˈdɪp.ɪ.ti/', pos: 'noun',
      definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
      example: 'It was pure serendipity that led him to discover penicillin.' },
    { word: 'sonder', phonetic: '/ˈsɒn.dər/', pos: 'noun',
      definition: 'The realization that each passerby has a life as vivid and complex as one\'s own.',
      example: 'Walking through the busy market, she felt a deep sense of sonder.' },
    { word: 'solitude', phonetic: '/ˈsɒl.ɪ.tjuːd/', pos: 'noun',
      definition: 'The state or situation of being alone, often in a peaceful way.',
      example: 'He treasured the solitude of early morning runs.' },
    { word: 'epitome', phonetic: '/ɪˈpɪt.ə.mi/', pos: 'noun',
      definition: 'A person or thing that is a perfect example of a particular quality or type.',
      example: 'She is the epitome of grace under pressure.' },
  ];
  sampleWords.forEach(w => {
    trie.insert(w.word);
    dictionary[w.word.toLowerCase()] = w;
  });
  
  /* ═══════════════════════════════════════════════
     UI FUNCTIONS
  ═══════════════════════════════════════════════ */
  function updateStats() {
    document.getElementById('stat-words').textContent = Object.keys(dictionary).length;
    document.getElementById('stat-nodes').textContent = trie.nodeCount;
    document.getElementById('stat-ops').textContent = opCount;
    document.getElementById('word-count').textContent = Object.keys(dictionary).length;
  }
  
  function renderWordList() {
    const list = document.getElementById('word-list');
    const words = Object.keys(dictionary).sort();
    list.innerHTML = words.map(w => {
      const entry = dictionary[w];
      return `<div class="word-item ${w === currentWord ? 'active' : ''}" 
                id="wi-${w}" onclick="showDefinition('${w}')">
        <div>
          <div class="word-text">${w}</div>
          <div class="word-type">${entry.pos || ''}</div>
        </div>
        <button class="word-del-btn" onclick="event.stopPropagation();quickDelete('${w}')">✕</button>
      </div>`;
    }).join('');
    updateStats();
  }
  
  function showDefinition(word) {
    const entry = dictionary[word.toLowerCase()];
    currentWord = word.toLowerCase();
    renderWordList();
    if (!entry) return;
  
    const defs = entry.definition.split('|').map(d => d.trim());
    document.getElementById('def-area').innerHTML = `
      <div class="def-view">
        <div class="def-word">${word}</div>
        ${entry.phonetic ? `<div class="def-phonetic">${entry.phonetic}</div>` : ''}
        ${entry.pos ? `<div class="def-pos">${entry.pos}</div>` : ''}
        <ul class="def-meanings">
          ${defs.map((d, i) => `
            <li>
              <span class="def-num">${i+1}.</span>
              <div>
                <div class="def-text">${d}</div>
                ${entry.example && i === 0 ? `<div class="def-example">"${entry.example}"</div>` : ''}
              </div>
            </li>`).join('')}
        </ul>
      </div>`;
  
    // Scroll to word in list
    const el = document.getElementById(`wi-${word.toLowerCase()}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    el?.classList.add('highlight');
    setTimeout(() => el?.classList.remove('highlight'), 800);
  }
  
  function addWord() {
    const word = document.getElementById('inp-word').value.trim().toLowerCase();
    const phonetic = document.getElementById('inp-phonetic').value.trim();
    const pos = document.getElementById('inp-pos').value.trim();
    const def = document.getElementById('inp-def').value.trim();
    const example = document.getElementById('inp-example').value.trim();
  
    if (!word) { showToast('Vui lòng nhập từ', 'error'); return; }
    if (!def) { showToast('Vui lòng nhập định nghĩa', 'error'); return; }
    if (dictionary[word]) { showToast(`"${word}" đã tồn tại trong từ điển`, 'error'); return; }
  
    trie.insert(word);
    dictionary[word] = { word, phonetic, pos, definition: def, example };
    opCount++;
    addLog('add', `Đã thêm từ "${word}" vào từ điển`);
    renderWordList();
    renderTrie();
    showDefinition(word);
    clearInputs();
    showToast(`Đã thêm "${word}" thành công`, 'success');
    switchTab('def');
  }
  
  function deleteWord() {
    const word = document.getElementById('inp-search').value.trim().toLowerCase();
    if (!word) { showToast('Nhập từ cần xóa', 'error'); return; }
    quickDelete(word);
  }
  
  function quickDelete(word) {
    word = word.toLowerCase();
    if (!dictionary[word]) { showToast(`"${word}" không tồn tại`, 'error'); return; }
    const ok = trie.delete(word);
    if (ok) {
      delete dictionary[word];
      opCount++;
      addLog('del', `Đã xóa từ "${word}" khỏi từ điển`);
      if (currentWord === word) {
        currentWord = null;
        document.getElementById('def-area').innerHTML = `
          <div class="def-empty">
            <div class="def-empty-icon">🗑️</div>
            <div class="def-empty-text">Từ "${word}" đã được xóa</div>
          </div>`;
      }
      renderWordList();
      renderTrie();
      showToast(`Đã xóa "${word}"`, 'success');
    }
  }
  
  function searchWord() {
    const word = document.getElementById('inp-search').value.trim().toLowerCase();
    if (!word) { showToast('Nhập từ cần tìm', 'error'); return; }
    opCount++;
    addLog('search', `Tìm kiếm "${word}" trên Radix Trie`);
  
    const node = trie.search(word);
    if (node && dictionary[word]) {
      showToast(`Tìm thấy "${word}"`, 'info');
      showDefinition(word);
      switchTab('def');
    } else {
      // Try autocomplete
      const suggestions = trie.autocomplete(word).filter(w => dictionary[w]);
      if (suggestions.length > 0) {
        showToast(`Gợi ý: ${suggestions.slice(0,3).join(', ')}`, 'info');
      } else {
        showToast(`Không tìm thấy "${word}"`, 'error');
      }
      document.getElementById('def-area').innerHTML = `
        <div class="def-empty">
          <div class="def-empty-icon">🔍</div>
          <div class="def-empty-text">Không tìm thấy "${word}"</div>
          ${suggestions.length ? `<div style="margin-top:12px;font-size:13px;">Có thể bạn muốn tìm: <strong>${suggestions.slice(0,5).join(', ')}</strong></div>` : ''}
        </div>`;
    }
    updateStats();
  }
  
  function clearInputs() {
    ['inp-word','inp-phonetic','inp-pos','inp-def','inp-example'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }
  
  function switchTab(tab) {
    document.querySelectorAll('.tab').forEach((t,i) => {
      t.classList.toggle('active', ['def','trie','log'][i] === tab);
    });
    document.querySelectorAll('.view').forEach((v,i) => {
      v.classList.toggle('active', ['view-def','view-trie','view-log'][i] === `view-${tab}`);
    });
    if (tab === 'trie') renderTrie();
  }
  
  /* ═══════════════════════════════════════════════
     TRIE VISUALIZATION
  ═══════════════════════════════════════════════ */
  function renderTrie() {
    const svg = document.getElementById('trie-svg');
    const W = 900, H = 500;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  
    // Build layout tree
    const layout = [];
    function buildLayout(node, x, y, spanW, depth) {
      const childEdges = Object.keys(node.children);
      if (childEdges.length === 0) {
        layout.push({ node, x, y, isLeaf: true });
        return { minX: x, maxX: x };
      }
      const childWidth = spanW / childEdges.length;
      let childXs = [];
      childEdges.forEach((edge, i) => {
        const cx = x - spanW/2 + childWidth*(i+0.5);
        const cy = y + 80;
        const child = node.children[edge];
        buildLayout(child, cx, cy, childWidth * 0.9, depth+1);
        layout.push({ node: child, x: cx, y: cy, isLeaf: Object.keys(child.children).length === 0, edge, parentX: x, parentY: y });
        childXs.push(cx);
      });
      return {};
    }
  
    layout.length = 0;
    layout.push({ node: trie.root, x: W/2, y: 50, isLeaf: false, isRoot: true });
    buildLayout(trie.root, W/2, 50, W-80, 0);
  
    let svgHtml = `
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#c0392b" opacity="0.5"/>
        </marker>
      </defs>`;
  
    // Draw edges first
    layout.forEach(item => {
      if (item.parentX !== undefined) {
        const midX = (item.parentX + item.x) / 2;
        const midY = (item.parentY + item.y) / 2;
        svgHtml += `<line x1="${item.parentX}" y1="${item.parentY+16}" x2="${item.x}" y2="${item.y-16}" 
          stroke="#c0392b" stroke-width="1.5" stroke-opacity="0.4" marker-end="url(#arrow)"/>`;
        // Edge label
        svgHtml += `<text x="${midX}" y="${midY}" text-anchor="middle" 
          font-family="DM Mono,monospace" font-size="11" fill="#c0392b" font-weight="500"
          style="background:white">${escHtml(item.edge || '')}</text>`;
      }
    });
  
    // Draw nodes
    layout.forEach(item => {
      if (item.isRoot) {
        svgHtml += `<circle cx="${item.x}" cy="${item.y}" r="18" fill="#1a1a2e"/>
          <text x="${item.x}" y="${item.y+5}" text-anchor="middle" font-family="DM Mono,monospace" 
            font-size="10" fill="white">ROOT</text>`;
      } else if (item.isLeaf && item.node.isEnd) {
        svgHtml += `<rect x="${item.x-22}" y="${item.y-14}" width="44" height="28" rx="4"
          fill="#27734a" opacity="0.9"/>
          <text x="${item.x}" y="${item.y+5}" text-anchor="middle" font-family="DM Mono,monospace"
            font-size="9" fill="white" font-weight="500">${escHtml((item.node.wordKey||'').slice(0,8))}</text>`;
      } else if (item.node.isEnd) {
        svgHtml += `<circle cx="${item.x}" cy="${item.y}" r="14" fill="#2c3e6b"/>
          <circle cx="${item.x}" cy="${item.y}" r="10" fill="#27734a" opacity="0.7"/>`;
      } else {
        svgHtml += `<circle cx="${item.x}" cy="${item.y}" r="14" fill="#2c3e6b" opacity="0.85"/>`;
      }
    });
  
    // Legend
    svgHtml += `
      <rect x="16" y="${H-60}" width="240" height="48" rx="4" fill="rgba(0,0,0,0.04)" stroke="#c8bfaa" stroke-width="1"/>
      <circle cx="36" cy="${H-44}" r="7" fill="#1a1a2e"/>
      <text x="50" y="${H-40}" font-family="DM Mono,monospace" font-size="10" fill="#7a7060">Node trung gian</text>
      <rect x="26" y="${H-28}" width="20" height="12" rx="2" fill="#27734a"/>
      <text x="50" y="${H-18}" font-family="DM Mono,monospace" font-size="10" fill="#7a7060">Node lá (từ hoàn chỉnh)</text>`;
  
    svg.innerHTML = svgHtml;
  }
  
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  
  /* ═══════════════════════════════════════════════
     LOG
  ═══════════════════════════════════════════════ */
  function addLog(type, msg) {
    const area = document.getElementById('log-area');
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const badges = { add: 'badge-add', del: 'badge-del', search: 'badge-search' };
    const labels = { add: 'THÊM', del: 'XÓA', search: 'TÌM' };
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">${time}</span>
      <span class="log-badge ${badges[type]}">${labels[type]}</span>
      <span class="log-msg">${msg}</span>`;
    area.appendChild(entry);
    area.scrollTop = area.scrollHeight;
  }
  
  function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 2800);
  }
  
  /* ─── Enter key shortcuts ─── */
  document.getElementById('inp-word').addEventListener('keydown', e => { if (e.key === 'Enter') addWord(); });
  document.getElementById('inp-search').addEventListener('keydown', e => { if (e.key === 'Enter') searchWord(); });
  
  /* ─── Init ─── */
  renderWordList();
  renderTrie();
  addLog('add', 'Khởi tạo từ điển với 6 từ mẫu');