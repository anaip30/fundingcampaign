<template>
  <div class="withdraw">
    <h2>Isplati sredstva (vlasnik)</h2>

    <div v-if="campaigns.length === 0">
      <p>Još nema kreiranih kampanja.</p>
    </div>
    <div v-else>
      <div class="form-group">
        <label for="campSelect">Odaberi kampanju:</label>
        <select id="campSelect" v-model="selectedCampaign">
          <option disabled value="">-- odaberite kampanju --</option>
          <option v-for="c in campaigns" :key="c.id" :value="c.id">
            {{ c.id }} – {{ c.title }}
          </option>
        </select>
      </div>
      <button @click="submitWithdraw" :disabled="loading">
        {{ loading ? "Isplaćujem..." : "Isplati" }}
      </button>
      <p v-if="message" class="success">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Withdraw",
  props: {
    contract: { type: Object, required: true },  
    campaigns: { type: Array, required: true }
  },
  data() {
    return {
      selectedCampaign: "",  
      loading: false,
      message: "",
      error: ""
    };
  },
  methods: {
    async submitWithdraw() {
      this.error = "";
      this.message = "";

      if (this.selectedCampaign === "") {
        this.error = "Odaberite kampanju.";
        return;
      }
      this.loading = true;
      try {
        console.log("Withdraw.vue: poziv withdraw() za ID =", this.selectedCampaign);
        const tx = await this.contract.withdraw(Number(this.selectedCampaign));
        console.log("Withdraw.vue: tx hash =", tx.hash);
        await tx.wait();
        console.log("Withdraw.vue: isplata potvrđena");
        this.message = "Isplata uspješna!";
        this.$emit("campaignFunded");
      } catch (err) {
        console.error("Withdraw.vue greška:", err);
        this.error = err.message.replace("execution reverted: ", "");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.error { color: red; }
.success { color: green; }
.form-group { margin-bottom: 0.6rem; }
label { font-weight: bold; }
select { width: 100%; padding: 0.4rem; margin-top: 0.2rem; box-sizing: border-box; }
button { padding: 0.5rem 1rem; background-color: #2c3e50; border: none; color: white; border-radius: 4px; cursor: pointer; }
button:disabled { background-color: #888; cursor: not-allowed; }
</style>