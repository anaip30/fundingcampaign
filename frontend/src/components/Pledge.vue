<template>
  <div class="component-card">
    <h2>Uplati za kampanju</h2>

    <div v-if="campaigns.length === 0">
      <p>Još nema kreiranih kampanja.</p>
    </div>
    <div v-else>
      <div class="form-group">
        <label for="payer">Adresa uplatitelja</label>
        <input
          id="payer"
          v-model="payerAddress"
        
        />
      </div>

      <div class="form-group">
        <label for="pledgeCampSelect">Kampanja</label>
        <select id="pledgeCampSelect" v-model="selectedCampaign">
          <option disabled value=""> odaberite kampanju </option>
          <option v-for="c in campaigns" :key="c.id" :value="c.id">
            {{ c.id }} – {{ c.title }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="amount">Iznos (ETH)</label>
        <input id="amount" v-model="amount"  type="number"/>
      </div>

      <button @click="submitPledge" :disabled="loading">
        {{ loading ? "Uplaćujem..." : "Uplati" }}
      </button>
      <p v-if="message" class="success">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { markRaw } from "vue";
export default {
  name: "Pledge",
  props: {
    contract:  { type: Object, required: true },
    campaigns: { type: Array,  required: true }
  },
  data() {
    return {
      selectedCampaign: "",
      amount:            "",
      loading:           false,
      message:           "",
      error:             "",
      payerAddress:      ""
    };
  },
  methods: {
  async submitPledge() {
    this.error   = "";
    this.message = "";

    // Validacije
    if (!this.selectedCampaign) {
      this.error = "Odaberite kampanju.";
      return;
    }
    const raw = this.amount.trim();
    if (!raw || isNaN(raw) || Number(raw) <= 0) {
      this.error = "Unesite pozitivan iznos.";
      return;
    }

    this.loading = true;
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = provider.getSigner();

      const userContract = this.contract.connect(signer);
      
      console.log("Slanje transakcije...");
      const tx = await userContract.pledge(
        Number(this.selectedCampaign),
        { value: ethers.utils.parseEther(raw) }
      );
      
      await tx.wait();
      console.log("Transakcija uspješna:", tx.hash);

      this.message = "Uplata uspješna!";
      this.amount  = "";
      this.$emit("campaignFunded"); 

    } catch (err) {
      console.error("Greška pri uplati:", err);
      this.error = err.error?.message
        ? err.error.message.replace("execution reverted: ", "")
        : err.message;
    } finally {
      this.loading = false;
    }
  }
}
};
</script>

<style scoped>
.error   { color: red;   }
.success { color: green; }
.form-group { margin-bottom: 0.6rem; }
label { font-weight: bold; }
input, select {
  width: 100%;
  padding: 0.4rem;
  margin-top: 0.2rem;
  box-sizing: border-box;
}
button {
  padding: 0.5rem 1rem;
  background: #2c3e50;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background: #888;
  cursor: not-allowed;
}
</style>