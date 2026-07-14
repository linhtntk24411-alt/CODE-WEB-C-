/**
 * ====================================================================
 * URII DIY - ADMIN CHATBOT BUSINESS LOGIC (admin-chatbot.js)
 * ====================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const sessionsListContainer = document.getElementById("sessions-list");
    const searchSessionInput = document.getElementById("search-session");
    const filterBtns = document.querySelectorAll(".filter-btn");
    
    const blankState = document.getElementById("blank-state");
    const activeChatConsole = document.getElementById("active-chat-console");
    
    const activeAvatarText = document.getElementById("active-avatar-text");
    const activeUserName = document.getElementById("active-user-name");
    const activeUserEmail = document.getElementById("active-user-email");
    const activeSessionId = document.getElementById("active-session-id");
    const activeStatusBadge = document.getElementById("active-status-badge");
    const activeChatBody = document.getElementById("active-chat-body");
    
    const adminChatInput = document.getElementById("admin-chat-input");
    const btnAdminSend = document.getElementById("btn-admin-send");
    const aiDisabledWarning = document.getElementById("ai-disabled-warning");
    const badgeWaitingCount = document.getElementById("badge-waiting-count");
    
    const btnTakeover = document.getElementById("btn-takeover");
    const btnHandback = document.getElementById("btn-handback");

    // Local States
    let currentFilter = "all"; // 'all', 'waiting', 'active'
    let selectedSessionId = null;
    let searchQuery = "";
    let lastKnownSessionsJSON = "";

    // Load sessions data from localStorage
    function getSessions() {
        try {
            return JSON.parse(localStorage.getItem("urii_chat_sessions") || "{}");
        } catch (e) {
            console.error("Error reading urii_chat_sessions:", e);
            return {};
        }
    }

    // Save sessions data to localStorage
    function saveSessions(sessions) {
        localStorage.setItem("urii_chat_sessions", JSON.stringify(sessions));
    }

    // Format relative timestamp
    function formatTime(timestamp) {
        if (!timestamp) return "Gần đây";
        const date = new Date(timestamp);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }

    // Render Sessions List in the left pane
    function renderSessionsList() {
        const sessions = getSessions();
        const sessionList = Object.values(sessions);

        // Cập nhật số lượng khách đang chờ hỗ trợ lên tab bộ lọc
        const waitingCount = sessionList.filter(s => s.status === 'waiting').length;
        if (badgeWaitingCount) {
            badgeWaitingCount.textContent = waitingCount;
            badgeWaitingCount.style.display = waitingCount > 0 ? "inline-block" : "none";
        }

        // Lọc theo thanh tìm kiếm
        let filteredSessions = sessionList.filter(s => {
            const nameMatch = s.userName && s.userName.toLowerCase().includes(searchQuery.toLowerCase());
            const emailMatch = s.userEmail && s.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
            return nameMatch || emailMatch;
        });

        // Lọc theo Tabs trạng thái (All, Waiting, Active)
        if (currentFilter === "waiting") {
            filteredSessions = filteredSessions.filter(s => s.status === "waiting");
        } else if (currentFilter === "active") {
            filteredSessions = filteredSessions.filter(s => s.status === "active");
        }

        // Sắp xếp các cuộc chat có tin nhắn mới nhất lên đầu
        filteredSessions.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        // Kiểm tra trống danh sách
        if (filteredSessions.length === 0) {
            sessionsListContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <span class="material-symbols-outlined fs-2">chat_bubble_outline</span>
                    <p class="small mt-2">Không tìm thấy cuộc hội thoại nào</p>
                </div>
            `;
            return;
        }

        // Tạo danh sách HTML
        sessionsListContainer.innerHTML = filteredSessions.map(s => {
            const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
            let previewText = "Chưa có tin nhắn";
            if (lastMsg) {
                previewText = lastMsg.sender === "user" ? `Bạn: ${lastMsg.text}` : `Urii: ${lastMsg.text}`;
                if (lastMsg.sender === "admin") previewText = `Admin: ${lastMsg.text}`;
            }

            const initials = s.userName ? s.userName.split(" ").map(w => w[0]).join("").substring(0, 2) : "KV";
            const unreadBadge = s.unreadCount && s.unreadCount > 0 ? `<span class="badge bg-danger rounded-pill">${s.unreadCount}</span>` : "";
            const isSelected = s.sessionId === selectedSessionId ? "active" : "";
            const isUnread = s.unreadCount && s.unreadCount > 0 ? "unread" : "";
            
            // Trạng thái badge hiển thị bên dưới tên
            let statusBadge = "";
            if (s.status === "waiting") {
                statusBadge = `<span class="badge bg-warning text-dark px-1.5 py-0.5 small" style="font-size: 10px;">Chờ hỗ trợ</span>`;
            } else if (s.status === "active") {
                statusBadge = `<span class="badge bg-danger px-1.5 py-0.5 small" style="font-size: 10px;">Đang hỗ trợ</span>`;
            } else {
                statusBadge = `<span class="badge bg-secondary px-1.5 py-0.5 small" style="font-size: 10px;">AI Tư vấn</span>`;
            }

            return `
                <div class="session-item ${isSelected} ${isUnread}" data-id="${s.sessionId}">
                    <div class="position-relative">
                        <div class="avatar-circle bg-danger bg-opacity-75 text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase" style="width: 40px; height: 40px; font-size: 14px;">${initials}</div>
                        <span class="position-absolute bottom-0 end-0 border border-2 border-white rounded-circle active-status-dot" style="background-color: ${s.status === 'ai' ? '#22c55e' : (s.status === 'waiting' ? '#f59e0b' : '#ef4444')};"></span>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <div class="session-name text-truncate" style="max-width: 140px;">${s.userName || 'Khách vãng lai'}</div>
                            <span class="session-time">${formatTime(s.lastMessageTime)}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="session-preview text-truncate">${previewText}</div>
                            <div class="d-flex align-items-center gap-1.5">
                                ${statusBadge}
                                ${unreadBadge}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        // Gắn sự kiện click chọn session
        const items = sessionsListContainer.querySelectorAll(".session-item");
        items.forEach(item => {
            item.addEventListener("click", () => {
                const sid = item.getAttribute("data-id");
                selectSession(sid);
            });
        });
    }

    // Select and open chat details of a customer
    function selectSession(sessionId) {
        selectedSessionId = sessionId;

        const sessions = getSessions();
        const session = sessions[sessionId];
        if (!session) return;

        // Xóa thông báo tin nhắn chưa đọc
        if (session.unreadCount > 0) {
            session.unreadCount = 0;
            sessions[sessionId] = session;
            saveSessions(sessions);
            renderSessionsList();
        }

        // Cập nhật giao diện Chat Header
        activeUserName.textContent = session.userName || "Khách vãng lai";
        activeUserEmail.textContent = session.userEmail || "Không có Email";
        activeSessionId.textContent = `ID: ${session.sessionId}`;
        
        const initials = session.userName ? session.userName.split(" ").map(w => w[0]).join("").substring(0, 2) : "KV";
        activeAvatarText.textContent = initials;

        // Cập nhật trạng thái hiển thị
        const statusDot = activeChatConsole.querySelector(".active-status-dot");
        if (session.status === 'ai') {
            activeStatusBadge.textContent = "AI đang hỗ trợ tự động";
            activeStatusBadge.className = "badge bg-secondary";
            if (statusDot) statusDot.style.backgroundColor = "#22c55e"; // xanh lá
            aiDisabledWarning.style.display = "none";
            btnTakeover.classList.remove("d-none");
            btnHandback.classList.add("d-none");
        } else if (session.status === 'waiting') {
            activeStatusBadge.textContent = "Khách hàng đang chờ nhân viên tiếp quản";
            activeStatusBadge.className = "badge bg-warning text-dark";
            if (statusDot) statusDot.style.backgroundColor = "#f59e0b"; // vàng
            aiDisabledWarning.style.display = "none";
            btnTakeover.classList.remove("d-none");
            btnHandback.classList.add("d-none");
        } else if (session.status === 'active') {
            activeStatusBadge.textContent = "Nhân viên đang hỗ trợ trực tiếp";
            activeStatusBadge.className = "badge bg-danger";
            if (statusDot) statusDot.style.backgroundColor = "#ef4444"; // đỏ
            aiDisabledWarning.style.display = "block";
            btnTakeover.classList.add("d-none");
            btnHandback.classList.remove("d-none");
        }

        // Hiển thị khung chat và ẩn blank state
        blankState.classList.add("d-none");
        activeChatConsole.classList.remove("d-none");

        renderActiveMessages();
        
        // Focus vào khung nhập liệu
        adminChatInput.focus();
    }

    // Render active message thread bubbles
    function renderActiveMessages() {
        if (!selectedSessionId) return;

        const sessions = getSessions();
        const session = sessions[selectedSessionId];
        if (!session) return;

        activeChatBody.innerHTML = "";

        if (!session.messages || session.messages.length === 0) {
            activeChatBody.innerHTML = `
                <div class="text-center py-5 text-muted small">Chưa có tin nhắn nào trong hội thoại này</div>
            `;
            return;
        }

        session.messages.forEach(msg => {
            // Kiểm tra xem đây có phải tin nhắn dạng log hệ thống không
            if (msg.isSystemLog) {
                activeChatBody.innerHTML += `
                    <div class="system-log-row">
                        <div class="system-log-bubble">${msg.text}</div>
                    </div>
                `;
                return;
            }

            const timeStr = formatTime(msg.timestamp);
            
            if (msg.sender === "user") {
                // Incoming message (LEFT bubble)
                activeChatBody.innerHTML += `
                    <div class="chat-message-row customer-msg">
                        <div class="message-bubble">
                            <p>${msg.text}</p>
                            <div class="message-meta">
                                <span>${timeStr}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Outgoing message (RIGHT bubble)
                const isAI = msg.sender === "bot";
                const senderTag = isAI ? `<span class="badge bg-secondary p-0.5 fw-bold" style="font-size: 8px;">AI</span>` : `<span class="badge bg-danger p-0.5 fw-bold" style="font-size: 8px;">ADMIN</span>`;
                
                activeChatBody.innerHTML += `
                    <div class="chat-message-row shop-msg ${isAI ? 'bot-msg' : ''}">
                        <div class="message-bubble">
                            <p>${msg.text.replace(/\n/g, '<br>')}</p>
                            <div class="message-meta">
                                ${senderTag}
                                <span>${timeStr}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // Tự động cuộn xuống tin nhắn mới nhất
        activeChatBody.scrollTop = activeChatBody.scrollHeight;
    }

    // Send admin text response
    function sendAdminMessage() {
        const text = adminChatInput.value.trim();
        if (!text || !selectedSessionId) return;

        const sessions = getSessions();
        const session = sessions[selectedSessionId];
        if (!session) return;

        // Nếu trạng thái đang là AI hoặc Chờ phản hồi, khi Admin nhắn tin hệ thống sẽ tự động Tiếp quản (Active)
        let statusChanged = false;
        if (session.status !== 'active') {
            session.status = 'active';
            statusChanged = true;
            
            // Chèn thêm log hệ thống báo tiếp quản
            session.messages.push({
                text: "Nhân viên tư vấn đã bắt đầu tiếp quản cuộc trò chuyện.",
                sender: "admin",
                timestamp: Date.now(),
                isSystemLog: true
            });
        }

        // Thêm tin nhắn của Admin
        session.messages.push({
            text: text,
            sender: "admin",
            timestamp: Date.now()
        });
        session.lastMessageTime = Date.now();
        session.unreadCount = 0; // Đã xem

        sessions[selectedSessionId] = session;
        saveSessions(sessions);

        adminChatInput.value = "";
        adminChatInput.style.height = "auto";

        renderSessionsList();
        
        if (statusChanged) {
            selectSession(selectedSessionId); // Load lại để update header button
        } else {
            renderActiveMessages();
        }
    }

    // Manual Handoff takeover (Admin active, AI off)
    function takeoverChat() {
        if (!selectedSessionId) return;

        const sessions = getSessions();
        const session = sessions[selectedSessionId];
        if (!session) return;

        session.status = "active";
        session.messages.push({
            text: "Nhân viên tư vấn đã bắt đầu tiếp quản cuộc trò chuyện.",
            sender: "admin",
            timestamp: Date.now(),
            isSystemLog: true
        });
        session.lastMessageTime = Date.now();
        session.unreadCount = 0;

        sessions[selectedSessionId] = session;
        saveSessions(sessions);

        renderSessionsList();
        selectSession(selectedSessionId);
    }

    // Hand back support to AI chatbot (AI auto responds again)
    function handbackChat() {
        if (!selectedSessionId) return;

        const sessions = getSessions();
        const session = sessions[selectedSessionId];
        if (!session) return;

        session.status = "ai";
        session.messages.push({
            text: "Hệ thống đã chuyển giao lại quyền hỗ trợ cho Trợ lý ảo AI.",
            sender: "bot",
            timestamp: Date.now(),
            isSystemLog: true
        });
        session.lastMessageTime = Date.now();

        sessions[selectedSessionId] = session;
        saveSessions(sessions);

        renderSessionsList();
        selectSession(selectedSessionId);
    }

    // Reload UI when local storage changes on other pages / tabs
    function checkAndSyncStorage() {
        const currentJSON = localStorage.getItem("urii_chat_sessions") || "{}";
        if (currentJSON !== lastKnownSessionsJSON) {
            lastKnownSessionsJSON = currentJSON;
            renderSessionsList();
            if (selectedSessionId) {
                renderActiveMessages();
                
                // Đồng bộ lại trạng thái header (đề phòng trạng thái chat thay đổi)
                const sessions = getSessions();
                const session = sessions[selectedSessionId];
                if (session) {
                    const statusDot = activeChatConsole.querySelector(".active-status-dot");
                    if (session.status === 'ai') {
                        activeStatusBadge.textContent = "AI đang hỗ trợ tự động";
                        activeStatusBadge.className = "badge bg-secondary";
                        if (statusDot) statusDot.style.backgroundColor = "#22c55e";
                        aiDisabledWarning.style.display = "none";
                        btnTakeover.classList.remove("d-none");
                        btnHandback.classList.add("d-none");
                    } else if (session.status === 'waiting') {
                        activeStatusBadge.textContent = "Khách hàng đang chờ nhân viên tiếp quản";
                        activeStatusBadge.className = "badge bg-warning text-dark";
                        if (statusDot) statusDot.style.backgroundColor = "#f59e0b";
                        aiDisabledWarning.style.display = "none";
                        btnTakeover.classList.remove("d-none");
                        btnHandback.classList.add("d-none");
                    } else if (session.status === 'active') {
                        activeStatusBadge.textContent = "Nhân viên đang hỗ trợ trực tiếp";
                        activeStatusBadge.className = "badge bg-danger";
                        if (statusDot) statusDot.style.backgroundColor = "#ef4444";
                        aiDisabledWarning.style.display = "block";
                        btnTakeover.classList.add("d-none");
                        btnHandback.classList.remove("d-none");
                    }
                }
            }
        }
    }

    // --- EVENT BINDINGS ---
    
    // Search input
    searchSessionInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        renderSessionsList();
    });

    // Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderSessionsList();
        });
    });

    // Send Button click
    btnAdminSend.addEventListener("click", sendAdminMessage);

    // Keyboard Enter to send message
    adminChatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendAdminMessage();
        }
    });

    // Auto-growing textarea
    adminChatInput.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    });

    // Action buttons
    btnTakeover.addEventListener("click", takeoverChat);
    btnHandback.addEventListener("click", handbackChat);

    // Initialize Page
    lastKnownSessionsJSON = localStorage.getItem("urii_chat_sessions") || "{}";
    renderSessionsList();

    // Storage updates listener
    window.addEventListener("storage", (e) => {
        if (e.key === "urii_chat_sessions") {
            checkAndSyncStorage();
        }
    });
    
    // Periodically poll for real-time changes
    setInterval(checkAndSyncStorage, 1500);
});
