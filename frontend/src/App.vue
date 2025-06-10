<template>
  <div id="app">
    <div class="header">
      <h1>Crowdfunding Platforma</h1>
      <p v-if="adminAccount">
        <strong>Admin račun:</strong> {{ adminAccount.address }}
      </p>
    </div>

    <div class="main-layout">
      <div class="actions-column">
        <CreateCampaign v-if="contract" :contract="contract" @campaignCreated="loadCampaigns" />
        <Pledge v-if="contract" :contract="contract" :campaigns="campaigns" @campaignFunded="loadCampaigns" />
        <Withdraw v-if="contract" :contract="contract" :campaigns="campaigns" @campaignFunded="loadCampaigns" />
        <Refund v-if="contract" :contract="contract" :campaigns="campaigns" @campaignFunded="loadCampaigns" />
      </div>

      <div class="list-column">
        <CampaignList v-if="contract" :campaigns="campaigns" />
      </div>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { markRaw } from "vue";
import CreateCampaign from "./components/CreateCampaign.vue";
import Pledge from "./components/Pledge.vue";
import Withdraw from "./components/Withdraw.vue";
import Refund from "./components/Refund.vue";
import CampaignList from "./components/CampaignList.vue";

export default {
  name: "App",
  components: {
    CreateCampaign,
    Pledge,
    Withdraw,
    Refund,
    CampaignList
  },
  data() {
    return {
      hardhatAccounts: [],  
      adminAccount: null,  
      contract: null,      
      campaigns: []         
    };
  },
  async created() {
    try {
      const resp = await fetch("/hardhatAccounts.json");
      if (!resp.ok) {
        throw new Error("hardhatAccounts.json nije pronađen");
      }
      this.hardhatAccounts = await resp.json();
      this.adminAccount = this.hardhatAccounts.find(a => a.index === 0);
      console.log("App.vue: hardhatAccounts =", this.hardhatAccounts);
      console.log("App.vue: adminAccount =", this.adminAccount);
    } catch (err) {
      console.error("App.vue: ne mogu učitati hardhatAccounts:", err);
      return;
    }

    await this.setupContract();
  },
  methods: {
    async setupContract() {
      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

      const wallet = new ethers.Wallet(this.adminAccount.privateKey, provider);

      let abi;
      try {
        const resp = await fetch("/abi/Crowdfunding.json");
        if (!resp.ok) {
          throw new Error("ABI nije pronađen (abi/Crowdfunding.json)");
        }
        const json = await resp.json();
        // PROVJERA: Ako json ima 'abi' property, koristi ga. Inače, koristi cijeli objekt.
        abi = json.abi ? json.abi : json;
      } catch (err) {
        alert("Greška pri učitavanju ABI-ja: " + err.message);
        return;
      }
      let contractAddress;
      try {
        const resp2 = await fetch("/contractAddress.json");
        if (!resp2.ok) {
          throw new Error("contractAddress.json nije pronađen");
        }
        const json2 = await resp2.json();
        contractAddress = json2.address;
      } catch (err) {
        alert("Greška pri dohvaćanju adrese ugovora: " + err.message);
        return;
      }

      try {
        this.contract = markRaw(new ethers.Contract(contractAddress, abi, wallet))
        console.log("App.vue: ugovor instanciran s adminAccount");
        await this.loadCampaigns();
      } catch (err) {
        alert("Ne mogu stvoriti instancu ugovora: " + err.message);
      }
    },

    async loadCampaigns() {
      if (!this.contract) return;
      try {
        console.log("App.vue: loadCampaigns pozvan");
        const raw = await this.contract.getCampaigns();
        this.campaigns = raw.map((c, i) => ({
          id:       i + 1,
          title:    c.title,
          creator:  c.creator,
          description: c.description,
          goal:     c.goal,
          pledged:  c.pledged,
          deadline: c.deadline.toNumber(),
          claimed:  c.claimed,
          beneficiary: c.beneficiary
        }));
        console.log("App.vue: campaigns =", this.campaigns);
      } catch (err) {
        console.error("App.vue: greška pri dohvatu kampanja:", err);
      }
    }
  }
};
</script>

<style>
:root {
  --bg-main: #1a1d21;
  --bg-surface: #2c3035;
  --bg-input: #212428;
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0a0;
  --border-color: #424242;
  --primary-color: #3d84e6;
  --primary-color-hover: #5a9eff;
  --success-color: #4caf50;
  --error-color: #f44336;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-main);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  max-width: 1440px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-top: 0;
  color: var(--text-primary);
}

/* Stilovi za zajedničke elemente unutar kartica */
.component-card {
  background-color: var(--bg-surface);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 1.2rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  box-sizing: border-box;
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

button {
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

button:hover {
  background-color: var(--primary-color-hover);
}

button:disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
}

.error {
  color: var(--error-color);
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--error-color);
  padding: 0.8rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.success {
  color: var(--success-color);
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid var(--success-color);
  padding: 0.8rem;
  border-radius: 6px;
  margin-top: 1rem;
}
</style>
