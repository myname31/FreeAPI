/**
 * Utility tools providing system services to interface modules
 */
const Utils = {
    /**
     * Renders standard responsive runtime component ink ripple visual effects
     */
    createRipple(event, element) {
        const circle = document.createElement("span");
        const diameter = Math.max(element.clientWidth, element.clientHeight);
        const radius = diameter / 2;

        const rect = element.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple-effect");

        const removeAnimation = () => {
            circle.remove();
        };

        const existingRipple = element.getElementsByClassName("ripple-effect")[0];
        if (existingRipple) existingRipple.remove();

        element.appendChild(circle);
    },

    /**
     * Creates clean numeric visual count interpolations inside DOM content slots
     */
    animateCounter(element, target, duration = 1000, suffix = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = Math.floor(progress * target);
            element.textContent = currentVal.toLocaleString() + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = target.toLocaleString() + suffix;
            }
        };
        window.requestAnimationFrame(step);
    },

    /**
     * Sanitizes and parses runtime strings applying syntax highlighters outputs
     */
    syntaxHighlightJson(jsonObj) {
        let json = JSON.stringify(jsonObj, null, 2);
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
            let cls = 'j-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'j-key';
                } else {
                    cls = 'j-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'j-boolean';
            } else if (/null/.test(match)) {
                cls = 'j-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
};

// Expose utilities elements framework
window.Utils = Utils;