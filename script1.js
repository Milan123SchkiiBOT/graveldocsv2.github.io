// script1.js

document.addEventListener('DOMContentLoaded', () => {

    // --- EXISTING JAVASCRIPT (Ensure these are present as well) ---

    // Sidebar Toggle
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const docsWrapper = document.querySelector('.docs-wrapper'); // Assuming docs-wrapper helps with overlay/push content

    if (sidebarToggleBtn && sidebar && docsWrapper) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            docsWrapper.classList.toggle('sidebar-active');
        });
    }
  const customContextMenu = document.getElementById('customContextMenu');
    const contextMenuCopy = document.getElementById('contextMenuCopy');
    const contextMenuSearch = document.getElementById('contextMenuSearch');
    let selectedText = ''; // To store the text selected by the user

    // Function to get selected text
    function getSelectedText() {
        if (window.getSelection) {
            return window.getSelection().toString();
        } else if (document.selection && document.selection.type !== 'Control') {
            return document.selection.createRange().text;
        }
        return '';
    }

    // Function to show the custom context menu
    function showCustomContextMenu(x, y) {
        customContextMenu.style.left = `${x}px`;
        customContextMenu.style.top = `${y}px`;
        customContextMenu.style.display = 'block';
    }

    // Function to hide the custom context menu
    function hideCustomContextMenu() {
        customContextMenu.style.display = 'none';
    }

    // --- MODIFIED LOGIC HERE ---
    // Event listener for right-click (contextmenu event)
    document.addEventListener('contextmenu', (e) => {
        // Prevent the default browser context menu always on right-click
        e.preventDefault();

        // Update selectedText regardless of whether it's empty or not
        selectedText = getSelectedText().trim();

        // Always show the custom context menu on right-click
        showCustomContextMenu(e.pageX, e.pageY);
    });

    // Event listener for clicks anywhere else to hide the menu
    document.addEventListener('click', (e) => {
        // Hide the custom menu if the click is outside of it
        if (e.target.closest('#customContextMenu') === null) {
            hideCustomContextMenu();
        }
    });

    // "Copy" functionality
    if (contextMenuCopy) {
        contextMenuCopy.addEventListener('click', () => {
            if (selectedText) { // This condition remains, so 'Copy' only works if text was selected
                navigator.clipboard.writeText(selectedText)
                    .then(() => {
                        console.log('Text copied:', selectedText);
                        hideCustomContextMenu();
                    })
                    .catch(err => {
                        console.error('Failed to copy text:', err);
                    });
            } else {
                hideCustomContextMenu(); // Hide menu even if no text was copied
            }
        });
    }

    // "Search" functionality
    if (contextMenuSearch) {
        contextMenuSearch.addEventListener('click', () => {
            if (selectedText) { // This condition remains, so 'Search' only works if text was selected
                const encodedText = encodeURIComponent(selectedText);
                window.open(`https://www.google.com/search?q=${encodedText}`, '_blank');
                hideCustomContextMenu();
            } else {
                hideCustomContextMenu(); // Hide menu even if no search was performed
            }
        });
    }
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const openSearchBtn = document.getElementById('openSearchBtn'); // The new search icon in navbar
    const searchResultsCount = document.getElementById('searchResultsCount');
    const docsContent = document.querySelector('.docs-content'); // The area to search within

    // REMOVED: let originalContent = docsContent.innerHTML; // Store original content to restore it

    // Function to show the search overlay
    function showSearchOverlay() {
        searchOverlay.style.display = 'flex'; // Make it visible (flex for centering)
        // A small delay to allow display change before transition starts
        setTimeout(() => {
            searchOverlay.classList.add('active');
            searchInput.focus(); // Focus the input field
        }, 10);
    }

    // Function to hide the search overlay
    function hideSearchOverlay() {
        searchOverlay.classList.remove('active');
        // --- FIX START ---
        removeHighlights(docsContent); // ONLY remove highlights, DO NOT reset innerHTML
        // --- FIX END ---
        searchResultsCount.textContent = ''; // Clear result count
        searchInput.value = ''; // Clear search input
        // A small delay to allow transition to finish before hiding completely
        setTimeout(() => {
            searchOverlay.style.display = 'none';
        }, 300);
    }

    // Function to highlight text
       function highlightText(element, searchTerm) {
        // Remove existing highlights first before re-highlighting
        removeHighlights(element);

        if (!searchTerm) {
            searchResultsCount.textContent = '';
            return 0; // No search term, no highlights
        }

        const regex = new RegExp(`(${searchTerm})`, 'gi'); // Case-insensitive global search
        let matchCount = 0;

        // Traverse the DOM looking for text nodes to highlight
        function traverseAndHighlight(node) {
            // --- FIX START ---
            // Add conditions to skip FAQ elements
            if (node.nodeType === Node.ELEMENT_NODE &&
                (node.classList.contains('faq-question') || node.classList.contains('faq-answer'))) {
                return; // Skip this node and its children if it's an FAQ question or answer
            }
            // --- FIX END ---

            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue;
                const matches = text.match(regex);
                if (matches) {
                    matchCount += matches.length;
                    const parent = node.parentNode;
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;

                    text.replace(regex, (match, p1, offset, string) => {
                        fragment.appendChild(document.createTextNode(string.substring(lastIndex, offset)));
                        const span = document.createElement('span');
                        span.className = 'highlight';
                        span.textContent = match;
                        fragment.appendChild(span);
                        lastIndex = offset + match.length;
                    });
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                    parent.replaceChild(fragment, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE &&
                       !['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(node.tagName) &&
                       !node.classList.contains('highlight') &&
                       !node.classList.contains('search-panel') &&
                       !node.classList.contains('custom-context-menu') &&
                       node.childNodes.length > 0) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    traverseAndHighlight(node.childNodes[i]);
                }
            }
        }

        traverseAndHighlight(element);
        return matchCount;
    }
    // Function to remove highlights
    function removeHighlights(element) {
        const highlights = element.querySelectorAll('span.highlight');
        highlights.forEach(span => {
            const parent = span.parentNode;
            // Replace the span with its text content
            parent.replaceChild(document.createTextNode(span.textContent), span);
            // Re-normalize the parent to merge adjacent text nodes
            parent.normalize();
        });
    }

    // Event listener for opening the search bar via navbar icon
    if (openSearchBtn) {
        openSearchBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSearchOverlay();
        });
    }

    // Event listener for closing the search bar
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', hideSearchOverlay);
    }

    // Event listener for 'Escape' key to close search bar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            hideSearchOverlay();
        }
    });

    // Event listener for Ctrl+F (or Cmd+F on Mac)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') { // Ctrl+F for Windows/Linux, Cmd+F for Mac
            e.preventDefault(); // Prevent browser's default find
            showSearchOverlay();
        }
    });

    // Event listener for search input changes
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim();
            // --- FIX START ---
            // REMOVED: docsContent.innerHTML = originalContent; // This line was the problem
            // --- FIX END ---
            const matchCount = highlightText(docsContent, searchTerm);

            if (searchTerm.length > 0) {
                searchResultsCount.textContent = `${matchCount} result${matchCount === 1 ? '' : 's'}`;
            } else {
                searchResultsCount.textContent = '';
            }
        });
    }

    // REMOVED: Capture the initial HTML content of docs-content
    // REMOVED: originalContent = docsContent.innerHTML; // This line is no longer needed as we don't reset innerHTML

    // "Copy" functionality (moved to the end of DOMContentLoaded for clarity, but functional placement doesn't matter)
    if (contextMenuCopy) {
        contextMenuCopy.addEventListener('click', () => {
            if (selectedText) {
                navigator.clipboard.writeText(selectedText)
                    .then(() => {
                        console.log('Text copied:', selectedText);
                        hideCustomContextMenu();
                    })
                    .catch(err => {
                        console.error('Failed to copy text:', err);
                    });
            } else {
                hideCustomContextMenu();
            }
        });
    }

    // "Search" functionality (moved to the end of DOMContentLoaded for clarity, but functional placement doesn't matter)
    if (contextMenuSearch) {
        contextMenuSearch.addEventListener('click', () => {
            if (selectedText) {
                const encodedText = encodeURIComponent(selectedText);
                window.open(`https://www.google.com/search?q=${encodedText}`, '_blank');
                hideCustomContextMenu();
            } else {
                hideCustomContextMenu();
            }
        });
    }

    // --- Original setup for other features (re-ordered for clarity, but functionally the same) ---

    // Smooth Scrolling for Sidebar Navigation
    const sections = document.querySelectorAll('.docs-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a.category-link, .sidebar-nav .submenu a');
    const categoryItems = document.querySelectorAll('.category-item');
    const submenus = document.querySelectorAll('.submenu');

    function highlightSidebarLink() {
        let currentActiveSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionBottom = sectionTop + section.clientHeight;

            if (pageYOffset >= sectionTop && pageYOffset < sectionBottom) {
                currentActiveSectionId = section.id;
            }
        });

        sidebarLinks.forEach(link => link.classList.remove('active'));
        categoryItems.forEach(item => item.classList.remove('active'));
        submenus.forEach(submenu => submenu.classList.remove('active'));

        if (currentActiveSectionId) {
            const correspondingLink = document.querySelector(`.sidebar-nav a[href="#${currentActiveSectionId}"]`);
            if (correspondingLink) {
                correspondingLink.classList.add('active');

                let currentElement = correspondingLink.parentElement;
                while (currentElement) {
                    if (currentElement.classList.contains('submenu')) {
                        currentElement.classList.add('active');
                        const categoryLink = currentElement.previousElementSibling;
                        if (categoryLink && categoryLink.classList.contains('category-link')) {
                            categoryLink.classList.add('active');
                        }
                    }
                    if (currentElement.classList.contains('category-item')) {
                        currentElement.classList.add('active');
                    }
                    currentElement = currentElement.parentElement;
                }
            }
        }
    }

    // Attach scroll listener
    window.addEventListener('scroll', highlightSidebarLink);
    // Call on load to set initial active state
    highlightSidebarLink();

    // Submenu Toggle
    document.querySelectorAll('.sidebar-nav .category-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.nextElementSibling && this.nextElementSibling.classList.contains('submenu')) {
                e.preventDefault();
            }

            const parentCategory = this.closest('.category-item');
            const submenu = this.nextElementSibling;

            if (submenu && submenu.classList.contains('submenu')) {
                parentCategory.classList.toggle('active');
                submenu.classList.toggle('active');
            }
        });
    });


    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');

            document.querySelectorAll('.faq-item .faq-answer.active').forEach(openAnswer => {
                if (openAnswer !== answer) {
                    openAnswer.classList.remove('active');
                    const prevQuestion = openAnswer.previousElementSibling;
                    if (prevQuestion && prevQuestion.classList.contains('faq-question')) {
                        prevQuestion.querySelector('i').classList.remove('active');
                        prevQuestion.classList.remove('active');
                    }
                }
            });

            answer.classList.toggle('active');
            icon.classList.toggle('active');
            this.classList.toggle('active');
        });
    });

    // Code Line Numbers
    document.querySelectorAll('pre.code-content code').forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        if (!pre.querySelector('.line-numbers-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('line-numbers-wrapper');

            const lines = codeBlock.textContent.split('\n').filter(line => line.trim() !== ''); // Keep filter if you don't want blank lines numbered

            for (let i = 1; i <= lines.length; i++) {
                const span = document.createElement('span');
                span.textContent = i;
                wrapper.appendChild(span);
            }
            pre.insertBefore(wrapper, codeBlock);
        }
    });



    document.querySelectorAll('pre.code-content code').forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        // Ensure that line numbers are not added multiple times if the script runs again for some reason.
        if (!pre.querySelector('.line-numbers-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('line-numbers-wrapper');

            // Split the code by new lines, and filter out any completely empty lines
            // to avoid numbering blank lines that might come from the HTML formatting.
const lines = codeBlock.textContent.split('\n'); // Temporarily remove filter

            // Create a span for each line number
            for (let i = 1; i <= lines.length; i++) {
                const span = document.createElement('span');
                span.textContent = i;
                wrapper.appendChild(span);
            }
            // Insert the line numbers wrapper before the code block within the <pre> tag.
            pre.insertBefore(wrapper, codeBlock);
        }
    });
    // Smooth Scrolling for Sidebar Navigation
    document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Remove active from all sections and sidebar links
                document.querySelectorAll('.docs-section').forEach(section => {
                    section.classList.remove('active');
                });
                document.querySelectorAll('.sidebar-nav .category-link').forEach(link => {
                    link.classList.remove('active');
                });
                document.querySelectorAll('.sidebar-nav .submenu').forEach(submenu => {
                    submenu.classList.remove('active');
                });
                document.querySelectorAll('.sidebar-nav .category-item').forEach(item => {
                    item.classList.remove('active');
                });

                // Add active to current section and its corresponding sidebar category/link
                targetSection.classList.add('active');
                this.classList.add('active'); // Add active to the clicked link
                this.closest('.category-item').classList.add('active'); // Add active to the parent category item
                const submenu = this.nextElementSibling;
                if (submenu && submenu.classList.contains('submenu')) {
                    submenu.classList.add('active');
                } else {
                    // If it's a sub-link, activate its parent submenu
                    const parentSubmenu = this.closest('.submenu');
                    if (parentSubmenu) {
                        parentSubmenu.classList.add('active');
                        parentSubmenu.previousElementSibling.classList.add('active'); // Activate the category link above it
                        parentSubmenu.closest('.category-item').classList.add('active'); // Activate the category item
                    }
                }

                // Scroll to the section
                window.scrollTo({
                    top: targetSection.offsetTop - 80, // Adjust for fixed header height
                    behavior: 'smooth'
                });

                // Close sidebar on small screens after clicking a link
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    docsWrapper.classList.remove('sidebar-active');
                }
            }
        });
    });
    

    // Submenu Toggle
    document.querySelectorAll('.sidebar-nav .category-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent default hash jump if it's a category header (not a direct section link)
            // or if it's a link that has a submenu right after it.
            if (this.nextElementSibling && this.nextElementSibling.classList.contains('submenu')) {
                e.preventDefault();
            }

            const parentCategory = this.closest('.category-item');
            const submenu = this.nextElementSibling;

            // Only toggle if it's a submenu
            if (submenu && submenu.classList.contains('submenu')) {
                parentCategory.classList.toggle('active');
                submenu.classList.toggle('active');
            }
        });
    });

window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('bot-invite-modal');

    const urlParams = new URLSearchParams(window.location.search);
    const mutualGuilds = urlParams.get('mutual');

    if (mutualGuilds) {
        const parsedGuilds = JSON.parse(decodeURIComponent(mutualGuilds));
        if (parsedGuilds.length > 0) {
            modal.style.display = 'none';

            const dropdown = document.getElementById('server-dropdown');
            parsedGuilds.forEach(g => {
                const option = document.createElement('option');
                option.value = g.id;
                option.textContent = g.name;
                dropdown.appendChild(option);
            });
        }
    }
});


    function highlightSidebarLink() {
        let currentActiveSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120; // Adjusted offset for better visibility
            const sectionBottom = sectionTop + section.clientHeight;

            if (pageYOffset >= sectionTop && pageYOffset < sectionBottom) {
                currentActiveSectionId = section.id;
            }
        });

        sidebarLinks.forEach(link => link.classList.remove('active'));
        categoryItems.forEach(item => item.classList.remove('active'));
        submenus.forEach(submenu => submenu.classList.remove('active'));

        if (currentActiveSectionId) {
            const correspondingLink = document.querySelector(`.sidebar-nav a[href="#${currentActiveSectionId}"]`);
            if (correspondingLink) {
                correspondingLink.classList.add('active');

                // Activate parent category and submenu if necessary
                let currentElement = correspondingLink.parentElement;
                while (currentElement) {
                    if (currentElement.classList.contains('submenu')) {
                        currentElement.classList.add('active');
                        // Also activate the category-link above this submenu
                        const categoryLink = currentElement.previousElementSibling;
                        if (categoryLink && categoryLink.classList.contains('category-link')) {
                            categoryLink.classList.add('active');
                        }
                    }
                    if (currentElement.classList.contains('category-item')) {
                        currentElement.classList.add('active');
                    }
                    currentElement = currentElement.parentElement;
                }
            }
        }
    }

    // Attach scroll listener
    window.addEventListener('scroll', highlightSidebarLink);
    // Call on load to set initial active state
    highlightSidebarLink();

async function loadServerSettings(serverId) {
    try {
        const response = await fetch(`/api/settings/${serverId}`);
        if (!response.ok) throw new Error("Fehler beim Laden der Serverdaten");

        const settings = await response.json();

        // Fülle die UI mit den erhaltenen Einstellungen
        document.getElementById('prefix').value = settings.prefix || '!';
        document.getElementById('log-channel').value = settings.logChannel || '';
        document.getElementById('welcome-message').value = settings.welcomeMessage || '';

        document.getElementById('selected-server-name').textContent = serverId;
        document.getElementById('settings-form-card').style.display = 'block';
    } catch (err) {
        alert(`Fehler: ${err.message}`);
    }
}
document.getElementById('load-settings-btn').addEventListener('click', () => {
    const serverId = document.getElementById('server-dropdown').value;
    if (!serverId) return alert('Bitte wähle zuerst einen Server aus!');
    loadServerSettings(serverId);
});
 const bubbleContainer = document.getElementById('bubble-container');
    const numBubbles = 20; // Anzahl der Blasen, die gleichzeitig existieren sollen

    // Funktion zum Erstellen einer einzelnen Blase
    function createBubble() {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Zufällige Größe (zwischen 20px und 80px)
        const size = Math.random() * 60 + 20; 
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Zufällige Startposition unten am Bildschirm
        const startX = Math.random() * window.innerWidth;
        bubble.style.left = `${startX}px`;
        bubble.style.bottom = `-${size}px`; // Startet knapp unter dem Bildschirm

        // Zufällige Animationsdauer (zwischen 8s und 20s)
        const duration = Math.random() * 12 + 8;
        bubble.style.animationDuration = `${duration}s`;

        // Zufällige Animationsverzögerung, damit sie nicht alle gleichzeitig starten
        const delay = Math.random() * 5; 
        bubble.style.animationDelay = `${delay}s`;

        // Zufällige seitliche Drift-Animation (damit sie sich nicht nur gerade hochbewegen)
        const driftAmount = Math.random() * 200 - 100; // Zwischen -100px und 100px
        const floatDistance = window.innerHeight + size; // Die Blase muss über den Bildschirm hinaus schweben

        // Dynamische Keyframes für jede Blase, um zufällige Drift zu ermöglichen
        const keyframes = `
            @keyframes bubbleFloat-${bubble.id} {
                from {
                    transform: translateY(0) translateX(0) scale(1);
                    opacity: 0;
                }
                25% {
                    opacity: 1; /* Sichtbar nach dem Start */
                }
                75% {
                    opacity: 1; /* Sichtbar bleiben */
                }
                to {
                    transform: translateY(-${floatDistance}px) translateX(${driftAmount}px) scale(${1 + Math.random() * 0.5}); /* Leicht größer werden */
                    opacity: 0;
                }
            }
        `;
        // Füge die dynamischen Keyframes einem <style>-Tag hinzu
        // Dies ist nicht die effizienteste Methode für sehr viele Blasen, aber für 20-50 ok.
        // Eine bessere Methode wäre CSS-Variablen, aber das wird komplexer.
        const styleSheet = document.createElement('style');
        styleSheet.id = `bubble-keyframes-${bubble.id}`; // Eine ID, um es bei Bedarf zu entfernen
        styleSheet.innerHTML = keyframes;
        document.head.appendChild(styleSheet);
         const bubbleContainer = document.getElementById('bubble-container');
    const numBubbles = 20; // Anzahl der Blasen, die gleichzeitig existieren sollen

    // Funktion zum Erstellen einer einzelnen Blase
    function createBubble() {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Zufällige Größe (zwischen 20px und 80px)
        const size = Math.random() * 60 + 20; 
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Zufällige Startposition unten am Bildschirm
        const startX = Math.random() * window.innerWidth;
        bubble.style.left = `${startX}px`;
        bubble.style.bottom = `-${size}px`; // Startet knapp unter dem Bildschirm

        // Zufällige Animationsdauer (zwischen 8s und 20s)
        const duration = Math.random() * 12 + 8;
        bubble.style.animationDuration = `${duration}s`;

        // Zufällige Animationsverzögerung, damit sie nicht alle gleichzeitig starten
        const delay = Math.random() * 5; 
        bubble.style.animationDelay = `${delay}s`;

        // Zufällige seitliche Drift-Animation (damit sie sich nicht nur gerade hochbewegen)
        const driftAmount = Math.random() * 200 - 100; // Zwischen -100px und 100px
        const floatDistance = window.innerHeight + size; // Die Blase muss über den Bildschirm hinaus schweben

        // Dynamische Keyframes für jede Blase, um zufällige Drift zu ermöglichen
        const keyframes = `
            @keyframes bubbleFloat-${bubble.id} {
                from {
                    transform: translateY(0) translateX(0) scale(1);
                    opacity: 0;
                }
                25% {
                    opacity: 1; /* Sichtbar nach dem Start */
                }
                75% {
                    opacity: 1; /* Sichtbar bleiben */
                }
                to {
                    transform: translateY(-${floatDistance}px) translateX(${driftAmount}px) scale(${1 + Math.random() * 0.5}); /* Leicht größer werden */
                    opacity: 0;
                }
            }
        `;
        // Füge die dynamischen Keyframes einem <style>-Tag hinzu
        // Dies ist nicht die effizienteste Methode für sehr viele Blasen, aber für 20-50 ok.
        // Eine bessere Methode wäre CSS-Variablen, aber das wird komplexer.
        const styleSheet = document.createElement('style');
        styleSheet.id = `bubble-keyframes-${bubble.id}`; // Eine ID, um es bei Bedarf zu entfernen
        styleSheet.innerHTML = keyframes;
        document.head.appendChild(styleSheet);
        
        // Weise die dynamische Animation der Blase zu
        bubble.style.animationName = `bubbleFloat-${bubble.id}`;

        // Blase nach Beendigung der Animation entfernen und neue erstellen
        bubble.addEventListener('animationend', () => {
            bubble.remove();
            styleSheet.remove(); // Entferne die dynamischen Keyframes
            createBubble(); // Erstelle eine neue Blase
        });

        bubbleContainer.appendChild(bubble);
        return bubble;
    }

    // Erstelle die initiale Anzahl von Blasen
    for (let i = 0; i < numBubbles; i++) {
        createBubble();
    }
        // Weise die dynamische Animation der Blase zu
        bubble.style.animationName = `bubbleFloat-${bubble.id}`;

        // Blase nach Beendigung der Animation entfernen und neue erstellen
        bubble.addEventListener('animationend', () => {
            bubble.remove();
            styleSheet.remove(); // Entferne die dynamischen Keyframes
            createBubble(); // Erstelle eine neue Blase
        });

        bubbleContainer.appendChild(bubble);
        return bubble;
    }

    // Erstelle die initiale Anzahl von Blasen
    for (let i = 0; i < numBubbles; i++) {
        createBubble();
    }
// --- NEW / UPDATED JAVASCRIPT FOR FAQ ACCORDION ---
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling; // The .faq-answer div
            const icon = this.querySelector('i'); // The Font Awesome icon

            // Close other open FAQ items if they are different from the current one
            document.querySelectorAll('.faq-item .faq-answer.active').forEach(openAnswer => {
                if (openAnswer !== answer) {
                    openAnswer.classList.remove('active');
                    const prevQuestion = openAnswer.previousElementSibling;
                    if (prevQuestion && prevQuestion.classList.contains('faq-question')) {
                        prevQuestion.querySelector('i').classList.remove('active');
                        prevQuestion.classList.remove('active'); // Remove active from the question itself
                    }
                }
            });

            // Toggle current FAQ item
            answer.classList.toggle('active');
            icon.classList.toggle('active'); // Rotate icon
            this.classList.toggle('active'); // Add/remove active class from the question itself
        });
    });

}); // End DOMContentLoaded