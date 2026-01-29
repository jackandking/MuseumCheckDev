/*
 * UnifiedGameControls - Shared mobile control system for MuseumCheck games
 * Responsible for rendering touch controls (d-pad, buttons, hints) and piping
 * pointer/touch events into game callbacks. Designed to be reusable by all
 * mini-games so they can provide consistent UX and avoid bespoke HTML wiring.
 */

class UnifiedGameControls {
    constructor(options = {}) {
        const {
            targetSelector,
            targetElement,
            scheme = 'dpad-fire',
            actions = ['up', 'down', 'left', 'right', 'fire'],
            labels = {},
            hints = [],
            onActionStart = () => {},
            onActionEnd = () => {},
        } = options;

        this.scheme = scheme;
        this.actions = actions;
        this.labels = labels;
        this.hints = hints;
        this.onActionStart = onActionStart;
        this.onActionEnd = onActionEnd;
        this.root = null;
        this.buttons = new Map();

        this.target = this.resolveTarget(targetElement, targetSelector);
        if (!this.target) {
            console.warn('[UnifiedGameControls] No valid target element provided');
            return;
        }

        this.render();
    }

    resolveTarget(targetElement, targetSelector) {
        if (targetElement instanceof HTMLElement) {
            return targetElement;
        }
        if (typeof targetSelector === 'string') {
            return document.querySelector(targetSelector);
        }
        return null;
    }

    render() {
        this.cleanup();

        const container = document.createElement('div');
        container.className = 'ugc-container';
        container.dataset.scheme = this.scheme;

        const controls = document.createElement('div');
        controls.className = 'ugc-controls';
        controls.appendChild(this.buildLayout());

        container.appendChild(controls);

        if (this.hints && this.hints.length) {
            const hintList = document.createElement('ul');
            hintList.className = 'ugc-hints';
            this.hints.forEach((hint) => {
                const li = document.createElement('li');
                li.textContent = hint;
                hintList.appendChild(li);
            });
            container.appendChild(hintList);
        }

        this.root = container;
        this.target.appendChild(container);
    }

    buildLayout() {
        switch (this.scheme) {
            case 'lr-fire':
                return this.buildLRFireLayout();
            case 'dpad-fire':
            default:
                return this.buildDpadFireLayout();
        }
    }

    buildDpadFireLayout() {
        const wrapper = document.createElement('div');
        wrapper.className = 'ugc-dpad-fire';

        const dpad = document.createElement('div');
        dpad.className = 'ugc-dpad';
        dpad.appendChild(this.buildButton('up'));
        const middleRow = document.createElement('div');
        middleRow.className = 'ugc-dpad-row';
        middleRow.appendChild(this.buildButton('left'));
        middleRow.appendChild(this.buildSpacer());
        middleRow.appendChild(this.buildButton('right'));
        dpad.appendChild(middleRow);
        dpad.appendChild(this.buildButton('down'));

        const fireColumn = document.createElement('div');
        fireColumn.className = 'ugc-fire-column';
        fireColumn.appendChild(this.buildButton('fire'));

        wrapper.appendChild(dpad);
        wrapper.appendChild(fireColumn);
        return wrapper;
    }

    buildLRFireLayout() {
        const wrapper = document.createElement('div');
        wrapper.className = 'ugc-lr-fire';

        const left = this.buildButton('left');
        const fire = this.buildButton('fire');
        const right = this.buildButton('right');

        wrapper.appendChild(left);
        wrapper.appendChild(fire);
        wrapper.appendChild(right);
        return wrapper;
    }

    buildSpacer() {
        const spacer = document.createElement('div');
        spacer.className = 'ugc-spacer';
        return spacer;
    }

    buildButton(action) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `ugc-btn ugc-btn-${action}`;
        btn.dataset.action = action;
        btn.textContent = this.labels[action] || this.defaultLabel(action);

        const startHandler = (e) => {
            e.preventDefault();
            this.onActionStart(action);
        };
        const endHandler = (e) => {
            if (e) e.preventDefault();
            this.onActionEnd(action);
        };

        btn.addEventListener('pointerdown', startHandler);
        btn.addEventListener('pointerup', endHandler);
        btn.addEventListener('pointerleave', endHandler);
        btn.addEventListener('pointercancel', endHandler);

        this.buttons.set(action, { element: btn, startHandler, endHandler });
        return btn;
    }

    defaultLabel(action) {
        const defaultMap = {
            up: '⬆️',
            down: '⬇️',
            left: '⬅️',
            right: '➡️',
            fire: '🔥',
            action: '⚡'
        };
        return defaultMap[action] || action;
    }

    updateCallbacks({ onActionStart, onActionEnd } = {}) {
        if (typeof onActionStart === 'function') {
            this.onActionStart = onActionStart;
        }
        if (typeof onActionEnd === 'function') {
            this.onActionEnd = onActionEnd;
        }
    }

    teardown() {
        this.cleanup();
    }

    cleanup() {
        if (!this.buttons.size) return;
        this.buttons.forEach(({ element, startHandler, endHandler }) => {
            element.removeEventListener('pointerdown', startHandler);
            element.removeEventListener('pointerup', endHandler);
            element.removeEventListener('pointerleave', endHandler);
            element.removeEventListener('pointercancel', endHandler);
        });
        this.buttons.clear();
        if (this.root && this.root.parentNode) {
            this.root.parentNode.removeChild(this.root);
        }
        this.root = null;
    }
}

if (typeof window !== 'undefined') {
    window.UnifiedGameControls = UnifiedGameControls;
}
