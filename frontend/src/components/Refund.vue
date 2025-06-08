<template>
  <div class="refund">
    <h2>Refundacija</h2>

    <div v-if="campaigns.length === 0">
      <p>Još nema kreiranih kampanja.</p>
    </div>
    <div v-else>
      <div class="form-group">
        <label for="acctSelect">Odaberi račun (donator):</label>
        <select v-model="selectedIndex" id="acctSelect">
          <option disabled value="">-- odaberite račun --</option>
          <option 
            v-for="acct in hardhatAccounts.slice(1)" 
            :key="acct.index" 
            :value="acct.index"
          >
            {{ acct.index }}: {{ acct.address }}
          </option>
        </select>
      </div>

  
      <div class="form-group">
        <label for="campSelect">Odaberi kampanju:</label>
        <select v-model="selectedCampaign" id="campSelect">
          <option disabled value="">-- odaberite kampanju --</option>
          <option v-for="c in campaigns" :key="c.id" :value="c.id">
            {{ c.id }} – {{ c.title }}
          </option>
        </select>
      </div>

      <button @click="submitRefund" :disabled="loading">
        {{ loading ? "Refundiram..." : "Refundiraj" }}
      </button>
      <p v-if="message" class="success">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";

export default {
  name: "Refund",
  props: {
    contract: { type: Object, required: true },         
    campaigns: { type: Array, required: true },
    hardhatAccounts: { type: Array, required: true }    
  },
  data() {
    return {
      selectedIndex: "",     
      selectedCampaign: "",  
      loading: false,
      message: "",
      error: ""
    };
  },
  methods: {
    async submitRefund() {
      this.error = "";
      this.message = "";

      if (this.selectedIndex === "") {
        this.error = "Molim vas, odaberite račun za refundaciju.";
        return;
      }
      if (this.selectedCampaign === "") {
        this.error = "Odaberite kampanju.";
        return;
      }

      this.loading = true;
      try {
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        const acctObj = this.hardhatAccounts.find(a => a.index === Number(this.selectedIndex));
        const userWallet = new ethers.Wallet(acctObj.privateKey, provider);

        const userContract = this.contract.connect(userWallet);

        console.log("Refund.vue: poziv refund() za ID =", this.selectedCampaign);
        const tx = await userContract.refund(Number(this.selectedCampaign));
        console.log("Refund.vue: tx hash =", tx.hash);
        await tx.wait();
        console.log("Refund.vue: refund potvrđen");
        this.message = "Refundacija uspješna!";
        this.$emit("campaignFunded");
      } catch (err) {
        console.error("Refund.vue greška:", err);
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