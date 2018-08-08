class EventObserver {
    constructor () {
      this.observers = []
    }
  
    subscribe (fn) {
      this.observers.push(fn)
    }
  
    unsubscribe (fn) {
      this.observers = this.observers.filter(subscriber => subscriber !== fn)
    }
  
    broadcast (data) {
      this.observers.forEach(subscriber => subscriber(data))
    }
  }
  
  function fetchCryptoByCurrencyName(currA, currB) {
    return fetch(`https://apiv2.bitcoinaverage.com/indices/global/ticker/${currA}${currB}`)
      .then(resp => resp.json());
  }
  
  function fetchCryptosToNormalCurrency(cryptosCurrs, normalCurr) {
    return Promise
      .all(cryptosCurrs.map(crypto => fetchCryptoByCurrencyName(crypto, normalCurr)))
      .then(responses => responses.reduce((acc, val, i) => {
        acc[cryptosCurrs[i]] = val;
        acc[cryptosCurrs[i]].code = cryptosCurrs[i];
        return acc;
      }, {}));
  }
  
  function updateView (viewId, data) {
    // TODO: get selector and updateView;
    const el = document.querySelector(viewId);


    if (!el) {
        return;
    }
    const hourChangeEl = el.querySelector('.hourChange');
    const dayChangeEL = el.querySelector('.dayChange');
    const weekChangeEL = el.querySelector('.weekChange');
    const monthChangeEL = el.querySelector('.monthChange');


    el.querySelector('.price').innerHTML = data.price;
    hourChangeEl.innerHTML = data.changes.hour;
    dayChangeEL.innerHTML = data.changes.day;
    weekChangeEL.innerHTML = data.changes.week;
    monthChangeEL.innerHTML = data.changes.month;

    hourChangeEl.className += (data.changes.hour < 0 ? ' negative' : '');
    dayChangeEL.className += (data.changes.day < 0 ? ' negative' : '');
    weekChangeEL.className += (data.changes.week < 0 ? ' negative' : '');
    monthChangeEL.className += (data.changes.month < 0 ? ' negative' : '');
  }
  
  function populateCurrencyChanges() {
    return { 
      price: 0,
      changes: {
        hour: 0,
        day: 0,
        week: 0,
        month: 0,
      }
    };
  }
  
  const cryptosCurrs = ['ETH', 'LTC', 'BTC'];
  const normalCurrs = ['USD', 'EUR', 'RUB','GBP'];
  const observer = new EventObserver();
  const state = {
    normalCurrency: 'USD',
    cryptoCurrencies: ['ETH', 'LTC', 'BTC'],
    // Api Data
    cryptoCurrenciesDataETH: {},
    cryptoCurrenciesDataLTC: {},
    cryptoCurrenciesDataBTC: {},
    // View Data
    ETH: populateCurrencyChanges(),
    LTC: populateCurrencyChanges(),
    BTC: populateCurrencyChanges(),
    
    // Togglers
    isETHToggled: false,
    isLTCToggled: false,
    isBTCToggled: false,
  };
  
  const updateState = (_observer, _state, key, value) => {
    _state[key] = value;
    _observer.broadcast({
      key,
      value,
      state: _state,
    });
  };
  
  
  observer.subscribe((payload) => {
    console.log('DEBUG: ---- update', payload.key, payload.value, '----');
  });
  
  
  observer.subscribe((payload) => {
    const keys = [
      'cryptoCurrenciesDataETH',
      'cryptoCurrenciesDataLTC',
      'cryptoCurrenciesDataBTC'
    ];
    
    if (!keys.includes(payload.key)) {
      return ; // SKIP
    }
  
    updateView(`#view-${payload.key}`, {
      price: payload.value.ask,
      changes: payload.state[`is${payload.value.code}Toggled`]
        ? payload.value.changes.percent
        : payload.value.changes.price,
    });
    
  });
  
  // observer.subscribe((payload) => {
  //   const keys = [
  //     'isETHToggled',
  //     'isLTCToggled',
  //     'isBTCToggled'
  //   ];
    
  //   if (!keys.includes(payload.key)) {
  //     return ; // SKIP
  //   }
  //
  //   updateState(observer, state, `cryptoCurrenciesData${data[key].code}`, data[key]);
  //
  // });
  
  // On store.normalCurrency changed
  observer.subscribe((payload) => {
    if (payload.key !== 'normalCurrency') {
      return ; // SKIP
    }
    
    return fetchCryptosToNormalCurrency(
      payload.state.cryptoCurrencies,
      payload.state.normalCurrency, 
    )
    .then(data => {
    
      for(let key in data) {
        updateState(observer, state, `cryptoCurrenciesData${data[key].code}`, data[key]);
      }
      
    });
    
    
  });
  
  
  function changeNormalCurrency(currencyName) {
    updateState(observer, state, 'normalCurrency', currencyName);
  }
  
  
  function toggleCryptoCurrencey(cryptoName) {
    updateState(observer, state, `is${cryptoName}Toggled`, !state[`is${cryptoName}Toggled`]);
    updateState(observer, state, `cryptoCurrenciesData${cryptoName}`, state[`cryptoCurrenciesData${cryptoName}`]);
  } 
  
//   changeNormalCurrency('USD');
  
//   setTimeout(() => toggleCryptoCurrencey('BTC'), 5000);
  
  