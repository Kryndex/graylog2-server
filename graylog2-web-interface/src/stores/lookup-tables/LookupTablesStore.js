import Reflux from 'reflux';

import UserNotification from 'util/UserNotification';
import URLUtils from 'util/URLUtils';
import fetch from 'logic/rest/FetchProvider';

import ActionsProvider from 'injection/ActionsProvider';

const LookupTablesActions = ActionsProvider.getActions('LookupTables');

const LookupTablesStore = Reflux.createStore({
  listenables: [LookupTablesActions],

  init() {
    this.pagination = {
      page: 1,
      per_page: 10,
      total: 0,
      count: 0,
      query: null,
    };
  },

  getInitialState() {
    return {
      pagination: this.pagination,
    };
  },

  reloadPage() {
    LookupTablesActions.reloadPage.promise(this.searchPaginated(this.pagination.page, this.pagination.per_page, this.pagination.query));
  },

  searchPaginated(page, perPage, query) {
    let url;
    if (query) {
      url = this._url(`tables?page=${page}&per_page=${perPage}&query=${encodeURIComponent(query)}&resolve=true`);
    } else {
      url = this._url(`tables?page=${page}&per_page=${perPage}&resolve=true`);
    }
    const promise = fetch('GET', url);

    promise.then((response) => {
      this.pagination = {
        count: response.count,
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        query: response.query,
      };
      this.trigger({
        tables: response.lookup_tables,
        caches: response.caches,
        dataAdapters: response.data_adapters,
        pagination: this.pagination,
      });
    }, this._errorHandler('Fetching lookup tables failed', 'Could not retrieve the lookup tables'));

    LookupTablesActions.searchPaginated.promise(promise);
  },

  get(idOrName) {
    const url = this._url(`tables/${idOrName}?resolve=true`);
    const promise = fetch('GET', url);

    promise.then((response) => {
      this.pagination = {
        count: response.count,
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        query: response.query,
      };
      this.trigger({
        table: response.lookup_tables[0],
        cache: response.caches,
        dataAdapter: response.data_adapters,
        pagination: this.pagination,
      });
    }, this._errorHandler(`Fetching lookup table ${idOrName} failed`, 'Could not retrieve lookup table'));

    LookupTablesActions.get.promise(promise);
  },

  _errorHandler(message, title, cb) {
    return (error) => {
      let errorMessage;
      try {
        errorMessage = error.additional.body.message;
      } catch (e) {
        errorMessage = error.message;
      }
      UserNotification.error(`${message}: ${errorMessage}`, title);
      if (cb) {
        cb(error);
      }
    };
  },

  _url(path) {
    return URLUtils.qualifyUrl(`/system/lookup/${path}`);
  },
});

export default LookupTablesStore;
