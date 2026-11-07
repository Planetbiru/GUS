(function (global) {
    function createNumberSpinner(input) {
        if (input.dataset.customSpinner === 'true') return input.parentElement;

        const document = input.ownerDocument;
        const wrapper = document.createElement('div');
        wrapper.className = 'number-input-wrap';
        input.dataset.customSpinner = 'true';
        if (input.parentNode) input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        for (const [direction, label] of [['up', 'Increase value'], ['down', 'Decrease value']]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `number-spinner-button number-spinner-${direction}`;
            button.setAttribute('aria-label', label);
            button.addEventListener('click', () => {
                const previousValue = input.value;
                if (direction === 'up') input.stepUp();
                else input.stepDown();
                if (input.value === previousValue) return;
                input.dispatchEvent(new document.defaultView.Event('input', {bubbles: true}));
                input.dispatchEvent(new document.defaultView.Event('change', {bubbles: true}));
            });
            wrapper.appendChild(button);
        }

        return wrapper;
    }

    function enhanceNumberInputs(root = document) {
        if (root instanceof global.HTMLInputElement && root.type === 'number') {
            createNumberSpinner(root);
        }
        root.querySelectorAll('input[type="number"]:not([data-custom-spinner])')
            .forEach(createNumberSpinner);
    }

    enhanceNumberInputs();

    const observer = new global.MutationObserver(records => {
        for (const record of records) {
            for (const node of record.addedNodes) {
                if (node.nodeType === global.Node.ELEMENT_NODE) enhanceNumberInputs(node);
            }
        }
    });
    observer.observe(document.body, {childList: true, subtree: true});

    global.SharedControls = Object.freeze({createNumberSpinner, enhanceNumberInputs});
})(window);
