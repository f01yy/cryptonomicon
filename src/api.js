const API_KEY =
  'a53fea58863edc120f634df994a3bd86ee589417a3fd6a93066417989e814635';

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const tickersHandlers = new Map();

const AGGREGATE_INDEX = '5';

socket.addEventListener('message', (e) => {
  let {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    MESSAGE: message,
    PARAMETER: parameter,
  } = JSON.parse(e.data);

  if (
    (type !== AGGREGATE_INDEX && type !== '500') ||
    (type === AGGREGATE_INDEX && newPrice === undefined)
  ) {
    return;
  }

  if (type === '500' && message === 'INVALID_SUB') {
    const splittedParameters = parameter.split('~');
    currency = splittedParameters[splittedParameters.length - 2];
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => {
    fn(newPrice);
  });
});

export const loadCoins = () =>
  fetch(
    `https://min-api.cryptocompare.com/data/all/coinlist?summary=true`
  ).then((r) => r.json());

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    'open',
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(tsym, fsym) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${tsym}~${fsym}`],
  });
}

function unsubscribeFromTickerOnWs(tsym, fsym) {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${tsym}~${fsym}`],
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) ?? [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker, 'USD');
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker, 'USD');
};
