/**
 * Footer Accordion – toggle trên tablet/mobile
 * - Desktop (>1024px): mở tất cả, không có hiệu ứng
 * - Tablet/Mobile (≤1024px): đóng mặc định, bấm tiêu đề để mở/đóng
 */
(function () {
    const BREAKPOINT = 1024;

    function initAccordion() {
        const footerCols = document.querySelectorAll('.footer-col');
        const isMobile = window.innerWidth <= BREAKPOINT;

        footerCols.forEach(col => {
            const heading = col.querySelector('h4');
            const content = col.querySelector('.footer-content');
            if (!heading) return;

            if (isMobile) {
                col.classList.remove('active');
                heading.style.cursor = 'pointer';
                heading.setAttribute('aria-expanded', 'false');
                if (content) {
                    content.style.display = 'none';
                }
            } else {
                col.classList.add('active');
                heading.style.cursor = 'default';
                heading.setAttribute('aria-expanded', 'true');
                if (content) {
                    content.style.display = '';
                }
            }
        });
    }

    function toggleAccordion(heading) {
        const col = heading.closest('.footer-col');

        if (!col || window.innerWidth > BREAKPOINT) return;

        const isOpen = col.classList.toggle('active');
        heading.setAttribute('aria-expanded', String(isOpen));

        const content = col.querySelector('.footer-content');
        if (content) {
            content.style.display = isOpen ? 'block' : 'none';
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const heading = e.target.closest('.footer-col h4');
            if (heading) {
                e.preventDefault();
                e.stopPropagation();
                toggleAccordion(heading);
            }
        }
    }

    document.addEventListener('click', function (e) {
        const heading = e.target.closest('.footer-col h4');
        if (!heading || window.innerWidth > BREAKPOINT) return;

        e.preventDefault();
        e.stopPropagation();
        toggleAccordion(heading);
    });

    document.addEventListener('keydown', handleKeydown);

    window.addEventListener('resize', function () {
        clearTimeout(window.__footerResizeTimer);
        window.__footerResizeTimer = setTimeout(initAccordion, 200);
    });

    window.initFooterAccordion = initAccordion;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordion);
    } else {
        initAccordion();
    }
})();