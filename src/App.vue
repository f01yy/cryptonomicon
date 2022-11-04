<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      v-if="false"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <div class="container">
      <add-ticker @add-ticker="add" :disabled="tooManyTickersAdded" />

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div>
          <button
            v-if="page > 1"
            @click="page = page - 1"
            class="mx-1 my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Назад
          </button>
          <button
            v-if="hasNextPage"
            @click="page = Number(page) + 1"
            class="mx-1 my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Вперед
          </button>
          <div>Фильтр: <input v-model="filter" type="text" /></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            @click="
              () => {
                if (!t.invalid) {
                  select(t);
                }
              }
            "
            :class="{
              'border-4': selectedTicker === t,
              'bg-red-500': t.invalid,
            }"
            v-for="t in paginatedTickers"
            :key="t.name"
            class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="handleDelete(t)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <ticker-graph
        v-if="selectedTicker"
        :selectedTicker="selectedTicker"
        :graph="graph"
        @unselect-ticker="selectedTicker = null"
        @new-max-graph-elements="saveMaxGraphElements"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTicker, unsubscribeFromTicker } from './api';
// import { loadCoins } from './api';

import AddTicker from './components/AddTicker.vue';
import TickerGraph from './components/TickerGraph.vue';

export default {
  name: 'App',
  components: { AddTicker, TickerGraph },

  data() {
    return {
      graphBarWidth: 38,
      tickers: [],
      selectedTicker: null,
      graph: [],
      page: 1,
      filter: '',
    };
  },

  created() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    if (windowData.filter) {
      this.filter = windowData.filter;
    }

    if (windowData.page) {
      this.page = windowData.page;
    }

    const tickersData = localStorage.getItem('cryptonomicon-list');

    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach((ticker) => {
        subscribeToTicker(ticker.name, (newPrice) =>
          this.updateTicker(ticker.name, newPrice)
        );
      });
    }
  },

  methods: {
    saveMaxGraphElements(count) {
      this.maxGraphElements = count;
    },
    updateTicker(tickerName, price) {
      this.tickers
        .filter((t) => t.name === tickerName)
        .forEach((ticker) => {
          if (price === undefined) {
            ticker.invalid = true;
          }
          if (ticker === this.selectedTicker && price !== undefined) {
            this.graph.push(price);

            while (this.graph.length > this.maxGraphElements) {
              this.graph.shift();
            }
          }

          ticker.price = price;
        });
    },

    formatPrice(price) {
      if (price === '-' || price === undefined) {
        return '-';
      }

      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    add(ticker) {
      this.filter = '';

      const currentTicker = {
        name: ticker.toUpperCase(),
        price: '-',
      };

      this.tickers = [...this.tickers, currentTicker];

      subscribeToTicker(currentTicker.name, (newPrice) =>
        this.updateTicker(currentTicker.name, newPrice)
      );
    },

    // useHint(coinName) {
    //   this.ticker = coinName;
    //   this.add();
    // },

    handleDelete(tickerToRemove) {
      this.tickers = this.tickers.filter((t) => t.name !== tickerToRemove.name);

      if (tickerToRemove.name === this.selectedTicker?.name) {
        this.selectedTicker = null;
      }

      unsubscribeFromTicker(tickerToRemove.name);
    },

    select(ticker) {
      this.selectedTicker = ticker;
    },

    // async fetchCoins() {
    //   const data = await loadCoins();
    //   this.coinsList = data.Data;
    // },
  },

  computed: {
    tooManyTickersAdded() {
      return this.tickers.length > 4;
    },
    // coinsHints() {
    //   return this.ticker.length
    //     ? Object.entries(this.coinsList)
    //         .filter(
    //           (coin) =>
    //             coin[0].startsWith(this.ticker.toUpperCase()) ||
    //             coin[1].FullName.toUpperCase().startsWith(
    //               this.ticker.toUpperCase()
    //             ) ||
    //             coin[1].Symbol.toUpperCase().startsWith(
    //               this.ticker.toUpperCase()
    //             )
    //         )
    //         .sort()
    //         .slice(0, 4)
    //     : [];
    // },

    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.tickers.filter((ticker) =>
        ticker.name.includes(this.filter.toUpperCase())
      );
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },
  },

  watch: {
    tickers() {
      localStorage.setItem('cryptonomicon-list', JSON.stringify(this.tickers));
    },

    selectedTicker() {
      this.graph = [];
    },

    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },

    filter() {
      this.page = 1;
    },

    page() {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${this.filter}&page=${this.page}`
      );
    },
  },

  mounted() {
    // this.fetchCoins();
  },
};
</script>
