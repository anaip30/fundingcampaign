<template>
  <div id="app">
    <div v-if="adminAccount">
      <p>
        <strong>Admin (račun #0):</strong>
        {{ adminAccount.address }}
      </p>
    </div>

    <CreateCampaign
      v-if="contract"
      :contract="contract"
      @campaignCreated="loadCampaigns"
    />

    <Pledge
      v-if="contract"
      :contract="contract"
      :campaigns="campaigns"
      :hardhatAccounts="hardhatAccounts"
      @campaignFunded="loadCampaigns"
    />

    <Withdraw
      v-if="contract"
      :contract="contract"
      :campaigns="campaigns"
      :hardhatAccounts="hardhatAccounts"
      @campaignFunded="loadCampaigns"
    />

    <Refund
      v-if="contract"
      :contract="contract"
      :campaigns="campaigns"
      :hardhatAccounts="hardhatAccounts"
      @campaignFunded="loadCampaigns"
    />

    <CampaignList
      v-if="contract"
      :campaigns="campaigns"
    />
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
        abi = json.abi;
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
        console.log("App.vue: getCampaigns raw =", raw);
        this.campaigns = raw.map((c, i) => ({
          id:       i + 1,
          title:    c.title,
          owner:    c.owner,
          goal:     c.goal,
          pledged:  c.pledged,
          deadline: c.deadline.toNumber(),
          claimed:  c.claimed
        }));
        console.log("App.vue: campaigns =", this.campaigns);
      } catch (err) {
        console.error("App.vue: greška pri dohvatu kampanja:", err);
      }
    }
  }
};
</script>

