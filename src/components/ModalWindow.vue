<template>
  <div class="modal" v-if="isOpen">
    <div class="modal__content">
      <div><slot name="content"></slot></div>
      <div><slot name="footer" :emitCloseAction="emitCloseAction"></slot></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },

  props: {
    isOpen: {
      type: Boolean,
      default: true,
    },
  },

  methods: {
    emitCloseAction() {
      this.$emit('close-modal');
    },
  },

  watch: {
    isOpen() {
      if (!this.isOpen) {
        console.log('Hello World!');
      }
    },
  },
};
</script>

<style scoped>
.modal {
  padding: 100px;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 10;
}

.modal__content {
  position: relative;
  padding: 20px;
  background-color: #fff;
  min-height: 200px;
  min-width: 400px;
  border-radius: 10px;
}
</style>
