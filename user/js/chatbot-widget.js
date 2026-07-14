const AI_API_KEY = "";

let chatFab = null;
let chatWindow = null;
let btnMinimize = null;
let btnClose = null;
let chatInput = null;
let btnSend = null;
let chatBody = null;
let typingIndicator = null;
let btnEmoji = null;
let emojiPicker = null;
let fileInput = null;

const SYSTEM_PROMPT = "Bạn là Trợ lý ảo Urii, một nhân viên tư vấn nhiệt tình, thông minh của cửa hàng bán bộ kit hạt đậu tạo hình (Perler Beads). Hãy trả lời bằng tiếng Việt, ngắn gọn, lịch sự và dễ hiểu.";

// ===== SESSION HELPERS FOR HUMAN-IN-THE-LOOP =====
// Lớp lưu trữ tạm thời trong bộ nhớ nếu localStorage bị vô hiệu hóa (Incognito / Sandbox)
const memoryStorage = {};

function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn("Truy cập localStorage.getItem bị chặn, sử dụng in-memory:", key);
        return memoryStorage[key] || null;
    }
}

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn("Truy cập localStorage.setItem bị chặn, sử dụng in-memory:", key);
        memoryStorage[key] = value;
    }
}

function getOrCreateSessionId() {
    try {
        const isLoggedIn = safeGetItem('isLoggedIn') === 'true';
        const userEmail = isLoggedIn ? (safeGetItem('userEmail') || 'guest') : 'guest';
        const cleanEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const storageKey = `urii_chat_session_id_${cleanEmail}`;

        let sessionId = safeGetItem(storageKey);
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
            safeSetItem(storageKey, sessionId);
        }
        return sessionId;
    } catch (e) {
        if (!window.__temp_session_id) {
            window.__temp_session_id = 'session_temp_' + Date.now();
        }
        return window.__temp_session_id;
    }
}

function getSessions() {
    try {
        const val = safeGetItem('urii_chat_sessions');
        return val ? JSON.parse(val) : {};
    } catch (e) {
        return window.__temp_sessions || {};
    }
}

function saveSessions(sessions) {
    try {
        safeSetItem('urii_chat_sessions', JSON.stringify(sessions));
    } catch (e) {
        window.__temp_sessions = sessions;
    }
}

function getCurrentSession() {
    const sessionId = getOrCreateSessionId();
    const sessions = getSessions();
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            sessionId: sessionId,
            userName: safeGetItem('userName') || 'Khách vãng lai',
            userEmail: safeGetItem('userEmail') || '',
            status: 'ai', // 'ai', 'waiting', 'active'
            lastMessageTime: Date.now(),
            unreadCount: 0,
            messages: []
        };
        saveSessions(sessions);
    }
    // Cập nhật thông tin nếu đã đăng nhập
    const isLoggedIn = safeGetItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        const uName = safeGetItem('userName');
        const uEmail = safeGetItem('userEmail');
        if (uName && sessions[sessionId].userName !== uName) {
            sessions[sessionId].userName = uName;
        }
        if (uEmail && sessions[sessionId].userEmail !== uEmail) {
            sessions[sessionId].userEmail = uEmail;
        }
        saveSessions(sessions);
    }

    // Đảm bảo dữ liệu session luôn đầy đủ cấu trúc và hợp lệ, tránh lỗi dữ liệu cũ bị crash
    const session = sessions[sessionId];
    if (session) {
        if (!Array.isArray(session.messages)) {
            session.messages = [];
        }
        if (!session.status) {
            session.status = 'ai';
        }
        if (typeof session.unreadCount !== 'number') {
            session.unreadCount = 0;
        }
    }
    return session;
}

function loadChatHistory() {
    const session = getCurrentSession();
    if (!chatBody) return;

    // Xóa tất cả tin nhắn cũ trong DOM ngoại trừ typing indicator
    const existingMessages = chatBody.querySelectorAll('.message');
    existingMessages.forEach(m => m.remove());

    if (session.messages.length > 0) {
        session.messages.forEach(msg => {
            appendMessage(msg, msg.sender);
        });
        updateHeaderStatus(session.status);
    } else {
        // Gửi lời chào chào mừng lần đầu tiên
        const welcome = {
            text: "Xin chào, Urii có thể giúp gì cho bạn?",
            chips: [
                { label: 'Xem giá bộ Kit', action: 'Xem giá bộ Kit' },
                { label: 'Màu sắc có sẵn', action: 'Màu sắc có sẵn' }
            ],
            timestamp: Date.now(),
            sender: 'bot'
        };
        session.messages.push(welcome);
        const sessions = getSessions();
        sessions[session.sessionId] = session;
        saveSessions(sessions);
        
        appendMessage(welcome, 'bot');
        updateHeaderStatus('ai');
    }
}

function updateHeaderStatus(status) {
    if (!chatWindow) return;
    const botNameEl = chatWindow.querySelector('.bot-name');
    const botStatusEl = chatWindow.querySelector('.bot-status');
    const statusDotEl = chatWindow.querySelector('.status-dot');
    const headerActions = chatWindow.querySelector('.header-actions');
    
    if (!botStatusEl) return;

    // Kiểm tra xem nút chuyển đổi AI đã tồn tại chưa
    let btnResetAi = chatWindow.querySelector('#btn-reset-ai');

    if (status === 'ai') {
        if (botNameEl) botNameEl.textContent = 'Trợ lý ảo Urii';
        botStatusEl.textContent = 'Đang trực tuyến';
        if (statusDotEl) {
            statusDotEl.style.backgroundColor = '#22c55e'; // Xanh lá
            statusDotEl.title = 'AI Đang hỗ trợ';
        }
        if (btnResetAi) btnResetAi.remove(); // Ẩn nút nếu đang trong chế độ AI
    } else {
        if (status === 'waiting') {
            if (botNameEl) botNameEl.textContent = 'Trợ lý ảo Urii';
            botStatusEl.textContent = 'Đang kết nối nhân viên...';
            if (statusDotEl) {
                statusDotEl.style.backgroundColor = '#f59e0b'; // Vàng cam
                statusDotEl.title = 'Đang chờ nhân viên';
            }
        } else if (status === 'active') {
            if (botNameEl) botNameEl.textContent = 'Nhân viên tư vấn';
            botStatusEl.textContent = 'Nhân viên đang hỗ trợ';
            if (statusDotEl) {
                statusDotEl.style.backgroundColor = '#ef4444'; // Đỏ
                statusDotEl.title = 'Nhân viên đang hỗ trợ';
            }
        }

        // Thêm nút chuyển sang chế độ AI nếu chưa có
        if (!btnResetAi && headerActions) {
            btnResetAi = document.createElement('button');
            btnResetAi.id = 'btn-reset-ai';
            btnResetAi.className = 'action-btn';
            btnResetAi.title = 'Quay lại Chat với AI';
            
            // Dùng icon bootstrap hoặc material symbols tương ứng
            const isBootstrap = headerActions.querySelector('.bi-dash') !== null || headerActions.querySelector('.bi-dash-lg') !== null || headerActions.querySelector('.bi-x-lg') !== null;
            if (isBootstrap) {
                btnResetAi.innerHTML = '<i class="bi bi-robot" style="font-size: 16px;"></i>';
            } else {
                btnResetAi.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">smart_toy</span>';
            }
            
            // Chèn vào đầu danh sách nút điều hướng
            headerActions.insertBefore(btnResetAi, headerActions.firstChild);

            btnResetAi.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Bạn có muốn quay lại trò chuyện với Trợ lý ảo AI không?')) {
                    const session = getCurrentSession();
                    session.status = 'ai';
                    
                    const sysMsg = {
                        text: 'Đã chuyển sang chế độ Trợ lý ảo AI. Trực tuyến và sẵn sàng hỗ trợ! ✨',
                        sender: 'bot',
                        timestamp: Date.now()
                    };
                    session.messages.push(sysMsg);
                    
                    const sessions = getSessions();
                    sessions[session.sessionId] = session;
                    saveSessions(sessions);
                    
                    loadChatHistory();
                    syncChatUI();
                }
            });
        }
    }
}

// Theo dõi thay đổi số lượng tin nhắn để tải lại giao diện
let lastKnownMessageCount = 0;
let lastKnownStatus = '';
function syncChatUI() {
    const session = getCurrentSession();
    if (session.messages.length !== lastKnownMessageCount || session.status !== lastKnownStatus) {
        loadChatHistory();
        lastKnownMessageCount = session.messages.length;
        lastKnownStatus = session.status;
    }
}

function initChatbot() {
    if (window.__chatbotWidgetInitialized) {
        return;
    }

    chatFab = document.getElementById('chat-fab');
    chatWindow = document.getElementById('chat-window');
    btnMinimize = document.getElementById('btn-minimize');
    btnClose = document.getElementById('btn-close');
    chatInput = document.getElementById('chat-input');
    btnSend = document.getElementById('btn-send');
    chatBody = document.getElementById('chat-body');
    typingIndicator = document.getElementById('typing-indicator');

    if (!chatFab || !chatWindow || !btnMinimize || !btnClose || !chatInput || !btnSend || !chatBody || !typingIndicator) {
        return;
    }
    // Ánh xạ các phần tử mới cho chức năng Emoji và File Upload
    btnEmoji = document.getElementById('btn-emoji');
    emojiPicker = document.getElementById('emoji-picker');
    fileInput = document.getElementById('chat-file-input');

    // 1. Kích hoạt chức năng Emoji
    if (btnEmoji && emojiPicker) {
        const emojis = ['😊', '😂', '🥰', '👍', '🔥', '❤️', '✨', '⭐', '😭', '😮'];
        emojiPicker.innerHTML = emojis.map(emo => `<span>${emo}</span>`).join('');
        
        btnEmoji.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPicker.classList.toggle('hidden');
        });

        emojiPicker.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN') {
                chatInput.value += e.target.textContent;
                emojiPicker.classList.add('hidden');
                chatInput.focus();
            }
        });

        document.addEventListener('click', () => emojiPicker.classList.add('hidden'));
    }

    // 2. Kích hoạt chức năng bấm nút dấu cộng để upload file
    const btnPlus = document.getElementById('btn-plus');
    if (btnPlus && fileInput) {
        btnPlus.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
    }

    window.__chatbotWidgetInitialized = true;

    // Load lịch sử hội thoại từ localStorage
    loadChatHistory();

    // Lắng nghe thay đổi từ các tab khác (ví dụ: admin đang chat ở tab khác)
    window.addEventListener('storage', (e) => {
        if (e.key === 'urii_chat_sessions' || e.key === 'isLoggedIn' || e.key === 'userEmail') {
            syncChatUI();
        }
    });

    // Lắng nghe sự kiện đăng nhập/đăng xuất để tải lại hội thoại mới tương ứng
    document.addEventListener('auth:changed', () => {
        console.log('🔄 Chatbot: Trạng thái tài khoản thay đổi, đồng bộ lại hội thoại...');
        loadChatHistory();
        syncChatUI();
    });

    // Theo dõi tin nhắn mới trong cùng trang
    const curSession = getCurrentSession();
    lastKnownMessageCount = curSession.messages.length;
    lastKnownStatus = curSession.status;
    setInterval(syncChatUI, 1500);

    // ----------------------------------------

    chatFab.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        scrollToBottom();
    });

    btnMinimize.addEventListener('click', () => chatWindow.classList.add('hidden'));
    btnClose.addEventListener('click', () => chatWindow.classList.add('hidden'));

    btnSend.addEventListener('click', handleUserSend);
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleUserSend();
        }
    });
}

window.initChatbotWidget = initChatbot;

(function autoBindChatbotEvents() {
    const observer = new MutationObserver((mutations, obs) => {
        const btnEmojiCheck = document.getElementById('btn-emoji');
        const btnPlusCheck = document.getElementById('btn-plus');
        const fileInputCheck = document.getElementById('chat-file-input');
        
        if (btnEmojiCheck && btnPlusCheck && fileInputCheck) {
            initChatbot();
            obs.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    if (document.getElementById('btn-emoji') && document.getElementById('btn-plus') && document.getElementById('chat-file-input')) {
        initChatbot();
    }
})();

async function handleUserSend() {
    try {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';

        const session = getCurrentSession();
        
        // Lưu tin nhắn của User
        const userMsg = {
            text: text,
            sender: 'user',
            timestamp: Date.now()
        };
        session.messages.push(userMsg);
        session.lastMessageTime = Date.now();
        
        // Nếu trạng thái đang là active hoặc waiting, tăng số unreadCount để admin thấy
        if (session.status === 'active' || session.status === 'waiting') {
            session.unreadCount = (session.unreadCount || 0) + 1;
        }
        
        const sessions = getSessions();
        sessions[session.sessionId] = session;
        saveSessions(sessions);
        
        // Hiển thị tin nhắn lên giao diện ngay lập tức
        appendMessage(userMsg, 'user');
        
        // Cập nhật biến theo dõi cục bộ để tránh reload dư thừa
        lastKnownMessageCount = session.messages.length;

        // Chỉ gọi AI tự động phản hồi nếu trạng thái là 'ai'
        if (session.status === 'ai') {
            showTyping(true);
            const replyData = await askRealAI(text);
            showTyping(false);

            const botReplyText = typeof replyData === 'string' ? replyData : (replyData.text || '');
            const botMsg = {
                text: botReplyText,
                sender: 'bot',
                timestamp: Date.now(),
                chips: typeof replyData === 'object' ? replyData.chips : undefined
            };

            // Lấy lại danh sách session mới nhất đề phòng thay đổi trong lúc chờ API
            const currentSessions = getSessions();
            const freshSession = currentSessions[session.sessionId] || session;
            freshSession.messages.push(botMsg);
            freshSession.lastMessageTime = Date.now();
            currentSessions[freshSession.sessionId] = freshSession;
            saveSessions(currentSessions);
            
            appendMessage(replyData, 'bot');
            lastKnownMessageCount = freshSession.messages.length;
        }
    } catch (error) {
        console.error("Lỗi khi xử lý gửi tin nhắn của User:", error);
    }
}

async function handleChipClick(chipText) {
    try {
        if (chipText === 'Đặt hàng yêu cầu' || 
            chipText === '🛒 Đặt hàng theo yêu cầu' || 
            chipText === 'Yêu cầu đặt hàng') {
            
            window.location.href = 'custom-order-request.html'; 
            return;
        }

        // Nếu người dùng chọn tư vấn từ nhân viên
        if (chipText === 'Tư vấn từ nhân viên' || chipText === ' Tư vấn từ nhân viên') {
            const session = getCurrentSession();
            
            const userMsg = {
                text: 'Tư vấn từ nhân viên',
                sender: 'user',
                timestamp: Date.now()
            };
            session.messages.push(userMsg);
            
            // Cập nhật trạng thái chờ tư vấn viên
            session.status = 'waiting';
            session.unreadCount = (session.unreadCount || 0) + 1;
            session.lastMessageTime = Date.now();
            
            const botMsg = {
                text: 'Dạ, Urii đã gửi yêu cầu hỗ trợ đến nhân viên tư vấn. Bạn vui lòng đợi một chút nhé, nhân viên sẽ phản hồi bạn ngay ạ! ✨',
                sender: 'bot',
                timestamp: Date.now()
            };
            session.messages.push(botMsg);
            
            const sessions = getSessions();
            sessions[session.sessionId] = session;
            saveSessions(sessions);
            
            appendMessage(userMsg, 'user');
            
            showTyping(true);
            setTimeout(() => {
                showTyping(false);
                appendMessage(botMsg, 'bot');
                updateHeaderStatus('waiting');
                
                // Cập nhật biến theo dõi
                lastKnownMessageCount = session.messages.length;
                lastKnownStatus = 'waiting';
            }, 800);
            return;
        }

        const session = getCurrentSession();
        const userMsg = {
            text: chipText,
            sender: 'user',
            timestamp: Date.now()
        };
        session.messages.push(userMsg);
        session.lastMessageTime = Date.now();
        
        if (session.status === 'active' || session.status === 'waiting') {
            session.unreadCount = (session.unreadCount || 0) + 1;
        }
        
        const sessions = getSessions();
        sessions[session.sessionId] = session;
        saveSessions(sessions);
        
        appendMessage(userMsg, 'user');
        lastKnownMessageCount = session.messages.length;

        if (session.status === 'ai') {
            showTyping(true);
            const replyData = await askRealAI(chipText);
            showTyping(false);

            const botMsg = {
                text: typeof replyData === 'string' ? replyData : (replyData.text || ''),
                sender: 'bot',
                timestamp: Date.now(),
                chips: typeof replyData === 'object' ? replyData.chips : undefined
            };

            const currentSessions = getSessions();
            const freshSession = currentSessions[session.sessionId] || session;
            freshSession.messages.push(botMsg);
            freshSession.lastMessageTime = Date.now();
            currentSessions[freshSession.sessionId] = freshSession;
            saveSessions(currentSessions);
            
            appendMessage(replyData, 'bot');
            lastKnownMessageCount = freshSession.messages.length;
        }
    } catch (error) {
        console.error("Lỗi khi xử lý click gợi ý của User:", error);
    }
}

async function askRealAI(userMessage) {
    if (!AI_API_KEY) {
        return getFallbackReply(userMessage);
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`AI request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
        }

        return 'Urii chưa nghe rõ, bạn nói lại được không ạ?';
    } catch (error) {
        console.error('Lỗi gọi AI:', error);
        return getFallbackReply(userMessage);
    }
}

function getFallbackReply(userMessage) {
    const text = normalizeText(userMessage);
    if (containsAny(text, ['hi', 'hello', 'shop oi', 'ad oi', 'xin chao', 'cho hoi'])) {
        return 'Dạ Urii xin chào bạn! Chúc bạn một ngày mới nhiều niềm vui. Bạn cần Urii hỗ trợ thông tin gì về bộ Kit hạt ủi sáng tạo ạ? ✨';
    }
    if (containsAny(text, ['mau', 'color', 'sac', 'bao nhieu mau','mau hat nhua ui'])) {
        return 'Bộ Kit Standard 24 màu bao gồm:\n\n🔴 Đỏ, 🟠 Cam, 🟡 Vàng\n🟢 Xanh Lá, 🔵 Xanh Dương\n💜 Tím, 🩶 Xám, ⚫ Đen\n⚪ Trắng, 🩷 Hồng, 🟤 Nâu\n\n+ Các màu pastel nhạt: Hồng nhạt, Xanh nhạt, Vàng nhạt...\n\nMỗi màu có số lượng hạt đủ để tạo nhiều tác phẩm đẹp!';
    }

    if (containsAny(text, ['gia', 'bao nhieu tien', 'bao nhieu k', 'price', 'phi', 'tien', 'ton kem'])) {
    return 'Dạ hiện tại bên Urii có sẵn đầy đủ 24 màu hạt nhựa lẻ cho bạn thoải mái lựa chọn ạ. Tất cả các màu đều đồng giá như nhau:\n\n' +
           '🛍️ Giá gói hạt nhựa lẻ: 35.000đ/gói (Mỗi gói có khoảng 500 hạt)\n\n' +
           'Ngoài ra bên mình còn có các phụ kiện bán rời nếu bạn cần mua thêm:\n' +
           '• Bảng khuôn nhựa lẻ (15x15cm): 50.000đ/cái\n' +
           '• Nhíp sắt chuyên dụng: 25.000đ/cái\n' +
           '• Giấy ủi chịu nhiệt: 10.000đ/xấp (5 tờ)\n\n' +
           '🎁 Đặc biệt: Khi bạn đặt mua nhiều gói hạt hoặc mua combo kèm phụ kiện, Urii sẽ TẶNG KÈM thêm giấy ủi miễn phí cho mình nha!\n\n' +
           'Bạn muốn lấy những màu nào hoặc cần mua thêm phụ kiện gì không, nhắn em lên đơn cho mình liền nhé! ✨';
    }

    if (containsAny(text, ['dat', 'mua', 'order'])) {
        return 'Bạn có thể đặt hàng ngay hôm nay!\n\n Cách đặt:\n1. Chọn sản phẩm trên trang\n2. Nhập thông tin giao hàng\n3. Chọn phương thức thanh toán\n4. Xác nhận đơn hàng\n\nHoặc liên hệ trực tiếp cửa hàng để được tư vấn chi tiết!';
    }

    if (containsAny(text, ['giao', 'ship', 'van chuyen'])) {
        return 'Cửa hàng hỗ trợ giao hàng:\n\n Giao nội thành: 1-2 ngày\n Giao ngoại thành: 2-3 ngày\n Phí vận chuyển: Tính theo khoảng cách\n\nBạn có thể theo dõi đơn hàng qua email hoặc SMS. Hàng được đóng gói cẩn thận, an toàn!';
    }

    if (containsAny(text, ['huong dan', 'cach dung', 'cach lam', 'how', 'ui'])) {
        return 'Hướng dẫn sử dụng bộ Kit Urii:\n\n BƯỚC 1: Chuẩn bị\n• Chọn hình ảnh yêu thích\n• Chuẩn bị bảng khuôn\n• Sắp xếp hạt theo màu\n\n BƯỚC 2: Xếp hạt\n• Dùng nhíp để xếp hạt lên bảng\n• Xếp theo hình ảnh, từ trên xuống\n• Xếp sát nhau để tạo hình\n\n BƯỚC 3: Ủi\n• Đặt giấy lên mặt bảng\n• Dùng bàn ủi nóng vừa phải\n• Ủi nhẹ nhàng trong 10-15 giây\n• Để nguội rồi tách bảng\n\n Thành phẩm sẽ bền, bóng và có thể dùng trang trí!';
    }

    if (containsAny(text, ['nguon goc', 'xuat xu', 'made', 'country', 'dau'])) {
        return 'Thông tin xuất xứ sản phẩm:\n\n Nhãn hiệu: Urii (Hàn Quốc)\n Sản xuất: Công ty CP Urii, Seoul, Hàn Quốc\n Chứng chỉ: Đã cấp phép bán tại Việt Nam\n Kiểm định: Hạt beads đạt tiêu chuẩn quốc tế\n\n Đây là sản phẩm chính hãng, được nhập khẩu trực tiếp, không hàng nhái!';
    }

    if (containsAny(text, ['an toan', 'safe', 'co doc', 'toxin', 'tox'])) {
        return ' Sản phẩm Urii hoàn toàn an toàn:\n\n Chất liệu:\n• Hạt beads làm từ nhựa polyethylene (PE) sạch\n• Không chứa BPA, không độc hại\n• Không có mùi hóa chất\n• Đã qua kiểm tra an toàn quốc tế\n\n Lưu ý:\n• Không để trẻ dưới 3 tuổi tự chơi (vì hạt nhỏ)\n• Giám sát trẻ khi sử dụng bàn ủi\n• Không nên nuốt hạt\n\n Phù hợp cho trẻ từ 5 tuổi trở lên!';
    }

    if (containsAny(text, ['tuoi', 'age', 'phu hop', 'can thien'])) {
        return ' Độ tuổi phù hợp:\n\n Từ 5-7 tuổi: Bắt đầu làm quen, cần giám sát\n Từ 8-12 tuổi: Tuổi vàng, tự tạo tác phẩm đẹp\n Từ 13+ tuổi: Có thể làm các mẫu phức tạp\n Người lớn: Hoàn toàn có thể tham gia & sáng tạo\n\n Lợi ích:\n• Phát triển tư duy sáng tạo\n• Cải thiện tập trung & khéo léo\n• Giảm căng thẳng, thêm vui vẻ\n• Làm quà tặng ý nghĩa\n\nBất kì lứa tuổi nào cũng có thể tìm thấy niềm vui với Urii! ';
    }

    if (containsAny(text, ['chat luong', 'quality', 'bao hanh', 'warranty', 'ham giu'])) {
        return ' Chất lượng & Bảo hành:\n\n Chất lượng:\n• Hạt beads: Mịn, đều, màu rõ\n• Bảng khuôn: Nhựa cứng, lỗ tròn chuẩn\n• Nhíp: Inox sắt, bền bỉ\n• Giấy ủi: Siêu bền, không rách\n\n Bảo hành:\n• 12 tháng từ ngày mua\n• Nếu hạt bị lỗi: Đổi hạt miễn phí\n• Nếu bảng khuôn bị hư: Hỗ trợ sửa/đổi\n\n Liên hệ hỗ trợ: Cửa hàng có đội ngũ CSKH 24/7!';
    }

    if (containsAny(text, ['thanh phan', 'ingredient', 'chi tiet', 'spec', 'specifications'])) {
        return ' Chi tiết sản phẩm Urii Kit Standard 24 màu:\n\nThành phần gồm:\n• 4.800 hạt beads (nhiều màu)\n• 1 bảng khuôn 15x15cm\n• 1 cái nhíp sắt\n• 1 tờ giấy ủi\n• 1 cuốn hướng dẫn Tiếng Việt\n\nKích thước & Cân nặng:\n• Kích thước hộp: 20x20x8cm\n• Cân nặng: ~450g\n• Độ tuổi: 5 tuổi trở lên\n\nThời gian sử dụng:\n• Tạo tác phẩm: 30-60 phút\n• Ủi hoàn thiện: 5-10 phút\n\n Bạn sẽ tạo được rất nhiều sản phẩm xinh từ 1 bộ kit này!';
    }

    if (containsAny(text, ['mua le', 'mua them', 'het hat', 'phu kien', 'khuon roi', 'nhip roi', 'giay ui them'])) {
        return 'Dạ Urii có bán lẻ phụ kiện và hạt thêm để bạn thoải mái sáng tạo nhé:\n• Túi hạt lẻ (chọn màu): 35.000đ/túi (500 hạt)\n• Khuôn nhựa lẻ 15x15cm: 50.000đ/cái\n• Nhíp sắt chuyên dụng: 25.000đ/cái\n• Giấy ủi chịu nhiệt tốt: 10.000đ/xấp 5 tờ\n\nBạn muốn mua thêm món nào nhắn shop chuẩn bị riêng cho mình nha!';
    }

    if (containsAny(text, ['khuyen mai', 'giam gia', 'coupon', 'voucher', 'uu dai', 'sale'])) {
        return 'Hiện tại Urii đang có chương trình ưu đãi cực hời:\n🎁 Tặng ngay 1 túi hạt Mix màu ngẫu nhiên cho đơn hàng bộ Kit Standard đầu tiên.\n🚚 Miễn phí vận chuyển toàn quốc cho hóa đơn từ 600.000đ.\n\nNhanh tay đặt hàng để nhận quà từ shop nhé ạ!';
    }

    if (containsAny(text, ['dia chi', 'o dau', 'cua hang', 'address', 'store', 'xem truc tiep'])) {
        return 'Bạn có thể ghé thăm shop hoặc đặt giao hàng nhanh qua địa chỉ:\n📍 Cửa hàng Urii Art & Craft: [Điền địa chỉ của bạn vào đây]\n⏰ Giờ mở cửa: 8:00 - 21:30 (Tất cả các ngày trong tuần)\n\nNếu bạn ở xa, shop có ship COD tận nhà, được kiểm tra hàng trước khi thanh toán nên bạn hoàn toàn yên tâm nha!';
    }
    return {
        text: 'Dạ hiện tại em chưa hiểu rõ ý của bạn lắm ạ. 🥺\n\nNếu bạn muốn đặt hàng hoặc cần hỗ trợ từ nhân viên, hãy bấm nút dưới đây để gửi yêu cầu nhanh nha!',
        chips: [
            { label: '🛒 Gửi Yêu Cầu Đặt Hàng', action: 'Yêu cầu đặt hàng' },
            { label: ' Tư vấn từ nhân viên', action: 'Tư vấn từ nhân viên' }
        ]
    };
}

function appendMessage(data, sender) {
    const now = (data && data.timestamp) ? new Date(data.timestamp) : new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const messageArticle = document.createElement('article');
    messageArticle.classList.add('message', `${sender}-message`);

    let msgText = typeof data === 'string' ? data : (data.text || '');
    let chipsData = typeof data === 'object' ? (data.chips || []) : [];

    if (sender === 'bot' || sender === 'admin') {
        let avatarHtml = `<img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKCfogwmg9DqaHtDqBGDh2EszSFoIZZh0_VFx8XTmsJvJQ6DvK6lTFpYUUQs4gkh03sU5B-CdJyukuKQI3rhRuKYPk2pen2JL5L9V5UXot14qDw1uz15BgBW1Jh-_7sxS2iwTvcE1_UVMGC7Wu4F-C4-vvBpA-xS01AIjeDjyDacX277JxX4u6OEYYqLtZWfvfEzFCFrgr5UPRDjkM8VL5YkMrne_f-MHbFHDpbTcGg_2j3mJ9MsLj1Od2yBZT76XH2Av_mLj0vLZu" class="bot-avatar-chat" alt="AI Icon">`;
        if (sender === 'admin') {
            avatarHtml = `<div class="admin-avatar-chat" style="width: 32px; height: 32px; background-color: #840001; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px;"><i class="bi bi-headset"></i></div>`;
        }

        let contentHtml = `
            ${avatarHtml}
            <div class="message-content-wrapper">
                <div class="message-bubble"><p>${msgText.replace(/\n/g, '<br>')}</p></div>
        `;
        if (chipsData.length > 0) {
            contentHtml += `<div class="suggested-chips">`;
            chipsData.forEach(chip => {
                contentHtml += `<button class="chip" onclick="handleChipClick('${chip.action}')">${chip.label}</button>`;
            });
            contentHtml += `</div>`;
        }

        contentHtml += `
                <time class="timestamp">${timeStr}</time>
            </div>
        `;
        messageArticle.innerHTML = contentHtml;
    } else {
        messageArticle.innerHTML = `
            <div class="user-avatar-chat">
                <i class="bi bi-person-fill"></i>
            </div>
            <div class="message-content-wrapper">
                <div class="message-bubble"><p>${msgText}</p></div>
                <time class="timestamp">${timeStr}</time>
            </div>
        `;
    }
    if (chatBody) {
        if (typingIndicator && typingIndicator.parentNode === chatBody) {
            chatBody.insertBefore(messageArticle, typingIndicator);
        } else {
            chatBody.appendChild(messageArticle);
        }
    }
    scrollToBottom();
}

function showTyping(show) {
    if (show) {
        typingIndicator.classList.remove('hidden');
    } else {
        typingIndicator.classList.add('hidden');
    }
    scrollToBottom();
}

function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}

function normalizeText(value) {
    if (typeof value !== 'string') return '';
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function containsAny(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword));
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '\'');
}
// ===== HÀM XỬ LÝ UPLOAD FILE / HÌNH ẢNH =====
function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Bộ lọc định dạng: Chỉ cho phép Hình ảnh, Word, PDF
    const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.doc|\.docx|\.pdf|\.xls|\.xlsx|\.ai|\.psd|\.svg|\.zip|\.rar)$/i;

    Array.from(files).forEach(file => {
        // Kiểm tra xem file gửi lên có đúng định dạng yêu cầu không
        if (!allowedExtensions.exec(file.name)) {
            alert(`File "${file.name}" không đúng định dạng!\nUrii chỉ nhận file Hình ảnh, Word hoặc PDF thôi ạ.`);
            return;
        }

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const messageArticle = document.createElement('article');
        messageArticle.classList.add('message', 'user-message');

        let filePreviewHtml = '';

        // Nếu là hình ảnh, hiển thị ảnh preview nhỏ trực tiếp trong bong bóng chat
        if (file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            filePreviewHtml = `<img src="${imageUrl}" style="max-width: 150px; border-radius: 8px; margin-top: 5px; display: block;" alt="Uploaded Image">`;
        } else {
            // Nếu là tài liệu văn bản Word/PDF, hiển thị kèm icon đẹp mắt
            let icon = '📄';
            if (file.name.endsWith('.pdf')) icon = '📕';
            if (file.name.includes('.doc')) icon = '📘';
            filePreviewHtml = `
                <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px; margin-top: 5px;">
                    <span style="font-size: 20px;">${icon}</span>
                    <span style="font-size: 13px; word-break: break-all; color: #333;">${file.name}</span>
                </div>`;
        }

        messageArticle.innerHTML = `
            <div class="user-avatar-chat">
                <i class="bi bi-person-fill"></i>
            </div>
            <div class="message-content-wrapper">
                <div class="message-bubble">
                    <p style="margin: 0; font-weight: 600; font-size: 13px; color: #555;">📎 Đã tải lên tài liệu:</p>
                    ${filePreviewHtml}
                </div>
                <time class="timestamp">${timeStr}</time>
            </div>
        `;

        chatBody.insertBefore(messageArticle, typingIndicator);
        scrollToBottom();

        // Tạo hiệu ứng chatbot phản hồi tự động sau khi nhận được file
        setTimeout(() => {
            showTyping(true);
            setTimeout(() => {
                showTyping(false);
                appendMessage(`Dạ, Urii đã nhận được file **"${file.name}"** của bạn rồi ạ! Shop sẽ kiểm tra file thiết kế này liền nha. ✨`, 'bot');
            }, 1200);
        }, 400);
    });

    // Reset lại ô chọn file để người dùng có thể tải tiếp file trùng tên ở lần sau
    fileInput.value = '';
}