<template>
  <div class="pledge">
    <h2>Uplati za kampanju</h2>

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

      <div class="form-group">
        <label for="amount">Iznos (ETH):</label>
        <input id="amount" v-model="amount" placeholder="npr. 0.1" />
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
    contract: { type: Object, required: true },
    campaigns: { type: Array, required: true },
    hardhatAccounts: { type: Array, required: true },
  },
  data() {
    return {
      selectedIndex: "",
      selectedCampaign: "",
      amount: "",
      loading: false,
      message: "",
      error: "",
    };
  },
  methods: {
    async submitPledge() {
      this.error = "";
      this.message = "";

      if (!this.selectedIndex) {
        this.error = "Molim vas, odaberite račun za uplatu.";
        return;
      }
      if (!this.selectedCampaign) {
        this.error = "Odaberite kampanju.";
        return;
      }

      let valueWei;
      try {
        valueWei = ethers.utils.parseEther(this.amount.trim());
      } catch {
        this.error = "Neispravan format iznosa.";
        return;
      }

      this.loading = true;
      try {
        // 1) Poveži se na lokalni Hardhat node
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

        // 2) Uzmi odabrani account iz liste
        const acctObj = this.hardhatAccounts.find(a => a.index === Number(this.selectedIndex));

        // 3) Kreiraj wallet iz njegovog privateKey
        const userWallet = new ethers.Wallet(acctObj.privateKey, provider);

        // 4) Spoji ugovor na tog walleta
       // const userContract = this.contract.connect(userWallet);
        const userContract = markRaw(this.contract.connect(userWallet));


        // 5) Pošalji transakciju pledga
        const tx = await userContract.pledge(
          Number(this.selectedCampaign),
          { value: valueWei }
        );
        await tx.wait();

        this.message = "Uplata uspješna!";
        this.amount = "";
        this.$emit("campaignFunded");
      } catch (err) {
        this.error = err.message.replace("execution reverted: ", "");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.error { color: red; }
.success { color: green; }
.form-group { margin-bottom: 0.6rem; }
label { font-weight: bold; }
select, input {
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