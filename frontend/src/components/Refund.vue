<template>
  <div class="component-card">
    <h2>Refundacija</h2>

    <div v-if="campaigns.length === 0">
      <p>Još nema kreiranih kampanja.</p>
    </div>
    <div v-else>
      <div class="form-group">
        <label for="userAddress"> Adresa uplatitelja</label>
        <input
          id="userAddress"
          v-model="userAddress"
        />
      </div>

      <div class="form-group">
        <label for="refundCampSelect">Odaberi kampanju za refundaciju</label>
        <select id="refundCampSelect" v-model="selectedCampaign">
          <option disabled value="">odaberite kampanju</option>
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
  },
  data() {
    return {
      userAddress: "",
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

      
      if (!this.userAddress.trim()) {
        this.error = "Molim vas, unesite adresu.";
        return;
      }
      if (!ethers.utils.isAddress(this.userAddress)) {
        this.error = "Unesena adresa nije ispravnog formata.";
        return;
      }
      if (this.selectedCampaign === "") {
        this.error = "Odaberite kampanju.";
        return;
      }

      this.loading = true;
      try {
        if (!window.ethereum) {
          throw new Error("MetaMask nije instaliran.");
        }
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const connectedAddress = await signer.getAddress();


        console.log("Unesena adresa:", "'" + this.userAddress.trim() + "'");
        console.log("Adresa iz MetaMaska:", "'" + connectedAddress + "'");

        if (this.userAddress.trim().toLowerCase() !== connectedAddress.toLowerCase()) {
          this.error = "Upisana adresa se ne podudara s aktivnom adresom u MetaMasku. Odaberite ispravan račun u MetaMasku.";
          this.loading = false;
          return;
        }

        // 4. Inicijalizacija ugovora sa stvarnim korisnikom (signerom)
        const userContract = this.contract.connect(signer);

        // 5. Slanje transakcije
        console.log("Refund.vue: poziv refund() za ID =", this.selectedCampaign);
        const tx = await userContract.refund(Number(this.selectedCampaign));
        
        await tx.wait();
        
        console.log("Refund.vue: refund potvrđen");
        this.message = "Refundacija uspješna!";
        this.$emit("campaignFunded"); 

      } catch (err) {
        console.error("Refund.vue greška:", err);
        this.error = err.reason || err.message;
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
input, select {
  width: 100%;
  padding: 0.4rem;
  margin-top: 0.2rem;
  box-sizing: border-box;
}
button {
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #888;
  cursor: not-allowed;
}
</style>