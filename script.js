function externalizeLinks() {
    document.querySelectorAll('a[href]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
    });
}

function initThemeToggle() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    const icon = toggle.querySelector('i');

    const apply = theme => {
        document.documentElement.dataset.theme = theme;
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
        toggle.setAttribute(
            'aria-label',
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        );
    };

    // The inline head script has already resolved the initial theme.
    apply(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

    toggle.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        apply(next);
        try {
            localStorage.setItem('theme', next);
        } catch (error) {
            // Storage unavailable (private mode); the theme still applies for this visit.
        }
    });

    // Keep following the OS until the visitor makes an explicit choice.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        let stored = null;
        try {
            stored = localStorage.getItem('theme');
        } catch (error) {
            stored = null;
        }
        if (!stored) apply(event.matches ? 'dark' : 'light');
    });
}

// Highlight the nav link of the section currently under the reading line.
function initScrollSpy() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const topbar = document.querySelector('.topbar');
    const navList = document.querySelector('.nav-links');
    const records = Array.from(document.querySelectorAll('.nav-links a'))
        .map(anchor => {
            const href = anchor.getAttribute('href');
            const section = href?.startsWith('#') ? document.querySelector(href) : null;
            return section ? { anchor, section, id: section.id } : null;
        })
        .filter(Boolean);

    let positions = [];
    let currentId = '';
    let frame = 0;

    const centerMobileLink = anchor => {
        if (!navList || window.innerWidth > 720) return;

        const targetLeft = anchor.offsetLeft - (navList.clientWidth - anchor.offsetWidth) / 2;
        navList.scrollTo({
            left: Math.max(0, targetLeft),
            behavior: reducedMotion ? 'auto' : 'smooth'
        });
    };

    const setActive = id => {
        if (!id || id === currentId) return;

        currentId = id;
        records.forEach(record => {
            const isActive = record.id === id;
            record.anchor.classList.toggle('active', isActive);

            if (isActive) {
                record.anchor.setAttribute('aria-current', 'location');
                centerMobileLink(record.anchor);
            } else {
                record.anchor.removeAttribute('aria-current');
            }
        });
    };

    const measure = () => {
        const scrollTop = window.scrollY;
        positions = records.map(record => ({
            ...record,
            top: record.section.getBoundingClientRect().top + scrollTop
        }));
    };

    const sync = () => {
        frame = 0;

        const scrollPosition = window.scrollY;
        topbar?.classList.toggle('is-stuck', scrollPosition > 8);

        // At the very bottom the last section may never reach the reading line.
        const atBottom = scrollPosition + window.innerHeight >= document.documentElement.scrollHeight - 2;
        const readingLine = scrollPosition + window.innerHeight * 0.35;
        let active = positions[0];
        positions.forEach(record => {
            if (record.top <= readingLine) active = record;
        });
        if (atBottom && positions.length) active = positions[positions.length - 1];

        if (active) setActive(active.id);
    };

    const schedule = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(sync);
    };

    const refresh = () => {
        measure();
        schedule();
    };

    records.forEach(record => {
        record.anchor.addEventListener('click', event => {
            event.preventDefault();
            setActive(record.id);
            record.section.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
            window.history.pushState(null, '', `#${record.id}`);
        });
    });

    measure();
    sync();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh, { once: true });
}

// Copy a paper's BibTeX entry (kept in a sibling <template>) to the clipboard.
function initBibtexButtons() {
    document.querySelectorAll('.pub-bibtex').forEach(button => {
        const source = button.nextElementSibling;
        if (!source?.matches('.pub-bibtex-source')) return;
        const label = button.innerHTML;
        let resetTimer = 0;
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(source.innerHTML.trim());
                button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied';
            } catch (error) {
                button.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Copy failed';
            }
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => { button.innerHTML = label; }, 1600);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initBibtexButtons();
    initScrollSpy();
    externalizeLinks();
});
