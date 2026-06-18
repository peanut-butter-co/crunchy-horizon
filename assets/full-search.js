import { Component } from '@theme/component';
import { debounce } from '@theme/utilities';
import { sectionRenderer } from '@theme/section-renderer';
import { morph } from '@theme/morph';
import { DialogCloseEvent, DialogOpenEvent } from '@theme/dialog';

/**
 * Full search component — dual-fetch layout:
 * - Products from /search?type=product (Section Rendering API)
 * - Queries + collections from /search/suggest?resources[type]=query,collection (Predictive Search API)
 *
 * @typedef {object} Refs
 * @property {HTMLInputElement} searchInput
 * @property {HTMLElement} searchLayout
 * @property {HTMLElement} searchResultsSidebar
 * @property {HTMLElement} searchResultsProducts
 * @property {HTMLElement} resetButton
 * @property {HTMLElement} [viewAllButton]
 * @extends {Component<Refs>}
 */
class FullSearchComponent extends Component {
  requiredRefs = ['searchInput', 'searchLayout', 'searchResultsSidebar', 'searchResultsProducts', 'resetButton'];

  /** @type {Map<string, {productsHtml: string, sidebarHtml: string}>} */
  #cache = new Map();

  #controller = new AbortController();

  /** @type {AbortController | null} */
  #activeFetch = null;

  get #minLength() {
    return parseInt(this.dataset.minLength ?? '3', 10);
  }

  get dialog() {
    return this.closest('dialog-component');
  }

  connectedCallback() {
    super.connectedCallback();

    const { dialog } = this;
    const { signal } = this.#controller;

    if (this.refs.searchInput.value.length > 0) {
      this.#showResetButton();
    }

    if (dialog) {
      document.addEventListener('keydown', this.#handleKeyboardShortcut, { signal });
      dialog.addEventListener(DialogCloseEvent.eventName, this.#handleDialogClose, { signal });
      dialog.addEventListener(DialogOpenEvent.eventName, this.#handleDialogOpen, { signal, once: true });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller.abort();
  }

  /** @param {KeyboardEvent} event */
  #handleKeyboardShortcut = (event) => {
    if (event.metaKey && event.key === 'k') {
      this.dialog?.toggleDialog();
    }
  };

  #handleDialogClose = () => {
    this.#resetSearch();
  };

  #handleDialogOpen = () => {
    this.refs.searchInput.focus();
  };

  search = debounce((event) => {
    if (!event.inputType) return;

    const term = this.refs.searchInput.value.trim();

    if (term.length < this.#minLength) {
      this.#clearResults();
      if (term.length === 0) {
        this.#hideResetButton();
      }
      return;
    }

    this.#showResetButton();
    this.#getSearchResults(term);
  }, 200);

  /** @param {string} term */
  async #getSearchResults(term) {
    const showCategories = this.dataset.showCategories !== 'false';
    const key = `${term.toLowerCase()}:${showCategories}`;

    if (this.#cache.has(key)) {
      this.#renderResults(/** @type {{productsHtml: string, sidebarHtml: string}} */ (this.#cache.get(key)));
      return;
    }

    const abort = this.#createAbortController();

    // Products via Section Rendering API (full search engine, like biribox)
    const searchUrl = new URL('/search', location.origin);
    searchUrl.searchParams.set('q', term);
    searchUrl.searchParams.set('type', 'product');
    searchUrl.searchParams.set('options[prefix]', 'last');

    try {
      let productsHtml, sidebarHtml;

      if (showCategories) {
        // Suggestions via Predictive Search API (queries + collections, like biribox)
        const suggestUrl = new URL(Theme.routes.predictive_search_url, location.origin);
        suggestUrl.searchParams.set('q', term);
        suggestUrl.searchParams.set('resources[type]', 'query,collection');

        [productsHtml, sidebarHtml] = await Promise.all([
          sectionRenderer.getSectionHTML('full-search-products', false, searchUrl),
          sectionRenderer.getSectionHTML('full-search', false, suggestUrl),
        ]);
      } else {
        productsHtml = await sectionRenderer.getSectionHTML('full-search-products', false, searchUrl);
        sidebarHtml = null;
      }

      if (abort.signal.aborted) return;

      const result = { productsHtml, sidebarHtml };
      this.#cache.set(key, result);
      this.#renderResults(result);
    } catch (error) {
      if (!abort.signal.aborted) throw error;
    }
  }

  /** @param {{productsHtml: string, sidebarHtml: string | null}} result */
  #renderResults({ productsHtml, sidebarHtml }) {
    morph(this.refs.searchResultsProducts, productsHtml);
    if (sidebarHtml) {
      morph(this.refs.searchResultsSidebar, sidebarHtml);
    } else {
      this.refs.searchResultsSidebar.innerHTML = '';
    }

    const hasSidebar = !!this.refs.searchResultsSidebar.querySelector('[data-search-sidebar]');
    this.refs.searchLayout.classList.toggle('full-search-results__layout--has-sidebar', hasSidebar);
    this.refs.searchInput.setAttribute('aria-expanded', 'true');
  }

  #clearResults() {
    this.refs.searchResultsProducts.innerHTML = '';
    this.refs.searchResultsSidebar.innerHTML = '';
    this.refs.searchLayout.classList.remove('full-search-results__layout--has-sidebar');
    this.refs.searchInput.setAttribute('aria-expanded', 'false');
  }

  #hideResetButton() {
    this.refs.resetButton.hidden = true;
  }

  #showResetButton() {
    this.refs.resetButton.hidden = false;
  }

  #createAbortController() {
    const abortController = new AbortController();
    if (this.#activeFetch) {
      this.#activeFetch.abort();
    }
    this.#activeFetch = abortController;
    return abortController;
  }

  resetSearch = debounce((keepFocus = true) => {
    if (keepFocus) {
      this.refs.searchInput.focus();
    }
    this.#resetSearch();
  }, 100);

  #resetSearch = () => {
    this.refs.searchInput.value = '';
    this.#hideResetButton();
    this.#clearResults();
  };

  /** @param {KeyboardEvent} event */
  onSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.#resetSearch();
      return;
    }

    if (event.key === 'Enter') {
      const singleResultEl = this.refs.searchResultsProducts.querySelector('[data-single-result-url]');
      if (singleResultEl instanceof HTMLElement && singleResultEl.dataset.singleResultUrl) {
        event.preventDefault();
        window.location.href = singleResultEl.dataset.singleResultUrl;
        return;
      }

      if (!event.target.closest('a, button')) {
        event.preventDefault();
        const searchUrl = new URL(Theme.routes.search_url, location.origin);
        searchUrl.searchParams.set('q', this.refs.searchInput.value.trim());
        searchUrl.searchParams.set('options[prefix]', 'last');
        window.location.href = searchUrl.toString();
      }
    }
  };

  viewAllResults() {
    const term = this.refs.searchInput.value.trim();
    if (!term) return;
    const searchUrl = new URL(Theme.routes.search_url, location.origin);
    searchUrl.searchParams.set('q', term);
    window.location.href = searchUrl.toString();
  }
}

if (!customElements.get('full-search-component')) {
  customElements.define('full-search-component', FullSearchComponent);
}
