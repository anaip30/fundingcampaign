<template>
  <div class="create-campaign">
    <h2>Kreiraj kampanju</h2>
    <div class="form-group">
      <label for="title">Naslov:</label>
      <input id="title" v-model="title" placeholder="Naslov kampanje" />
    </div>
    <div class="form-group">
      <label for="goal">Cilj (ETH):</label>
      <input id="goal" v-model="goal" placeholder="npr. 1.5" />
    </div>
    <div class="form-group">
      <label for="duration">Trajanje (sekunde):</label>
      <input id="duration" v-model="duration" placeholder="npr. 3600" />
    </div>
    <button @click="submitCreate" :disabled="loading">
      {{ loading ? "Kreiram…" : "Kreiraj" }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="success">{{ message }}</p>
  </div>
</template>

<script>
import { ethers } from "ethers";

export default {
  name: "CreateCampaign",
  props: {
    contract: { type: Object, required: true }
  },
  data() {
    return {
      title: "",
      goal: "",
      duration: "",
      loading: false,
      message: "",
      error: ""
    };
  },
  methods: {
    async submitCreate() {
      this.error = "";
      this.message = "";

      if (!this.title.trim()) {
        this.error = "Naslov je obavezan.";
        return;
      }
      const rawGoal = this.goal.trim();
      let goalWei;
      try {
        goalWei = ethers.utils.parseEther(rawGoal);
      } catch {
        this.error = "Neispravan format cilja.";
        return;
      }
      const durationSec = Number(this.duration.trim());
      if (isNaN(durationSec) || durationSec <= 0) {
        this.error = "Trajanje mora biti pozitivan broj sekundi.";
        return;
      }

      this.loading = true;
      try {
        console.log("CreateCampaign.vue: poziv createCampaign s:", {
          title: this.title.trim(),
          goalWei: goalWei.toString(),
          durationSec
        });
        const tx = await this.contract.createCampaign(
          this.title.trim(),
          goalWei,
          durationSec
        );
        console.log("CreateCampaign.vue: tx hash =", tx.hash);
        await tx.wait();
        console.log("CreateCampaign.vue: kampanja kreirana");
        this.message = "Kampanja je uspješno kreirana!";
        this.title = "";
        this.goal = "";
        this.duration = "";
        this.$emit("campaignCreated");
      } catch (err) {
        console.error("CreateCampaign.vue greška:", err);
        this.error = err.message.replace("execution reverted: ", "");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.create-campaign {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 6px;
  max-width: 400px;
}
.form-group {
  margin-bottom: 0.6rem;
}
label {
  font-weight: bold;
}
input {
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
.success {
  color: green;
  margin-top: 0.6rem;
}
.error {
  color: red;
  margin-top: 0.6rem;
}
</style>