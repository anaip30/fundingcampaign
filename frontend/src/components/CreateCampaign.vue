<template>
  <div class="component-card">
    <h2>Kreiraj novu kampanju</h2>
    <div class="form-group">
      <label for="title">Naslov</label>
      <input id="title" v-model="title"  />
    </div>

    <div class="form-group">
      <label for="description">Opis kampanje</label>
      <textarea id="description" v-model="description" rows="4" ></textarea>
    </div>

    <div class="form-group">
      <label for="beneficiary">Adresa primatelja</label>
      <input id="beneficiary" v-model="beneficiary"  />
    </div>

    <div class="form-group">
      <label for="goal"> Iznos ETH</label>
      <input id="goal" v-model="goal"  type="number" />
    </div>

    <div class="form-group">
      <label for="duration">Trajanje u danima</label>
      <input id="duration" v-model="duration"  type="number" />
    </div>

    <button @click="submitCreate" :disabled="loading">
      {{ loading ? "Kreiram..." : "Kreiraj kampanju" }}
    </button>
    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>


<script>
import { ethers } from "ethers";

export default {
  name: "CreateCampaign",
  props: {
    contract: { type: Object, required: true },
  },
  data() {
    return {
      title: "",
      description: "", // NOVO
      beneficiary: "", // NOVO
      goal: "",
      duration: "",
      loading: false,
      message: "",
      error: "",
    };
  },
 // Unutar <script> dijela u CreateCampaign.vue
methods: {
  // U datoteci: frontend/src/components/CreateCampaign.vue

// U datoteci: frontend/src/components/CreateCampaign.vue
async submitCreate() {
  this.error = "";
  this.message = "";

  // --- ISPRAVLJENA VALIDACIJA ---

  // 1. Provjera tekstualnih polja
  if (!this.title.trim() || !this.description.trim() || !this.beneficiary.trim()) {
    this.error = "Naslov, opis i adresa primatelja su obavezni.";
    return;
  }
  if (!ethers.utils.isAddress(this.beneficiary)) {
    this.error = "Adresa primatelja nije ispravnog formata.";
    return;
  }

  // 2. Provjera numeričkih polja
  if (this.goal === '' || Number(this.goal) <= 0) {
    this.error = "Unesite ispravan, pozitivan ciljni iznos (ETH).";
    return;
  }
  if (this.duration === '' || Number(this.duration) <= 0) {
    this.error = "Unesite ispravno, pozitivno trajanje u danima.";
    return;
  }

  // --- KRAJ ISPRAVLJENE VALIDACIJE ---

  this.loading = true;
  try {
    const goalInWei = ethers.utils.parseEther(this.goal.toString()); // Dodan .toString() za sigurnost
    const durationInSeconds = Number(this.duration) * 86400;
    
    const tx = await this.contract.createCampaign(
      this.title,
      this.description,
      goalInWei,
      durationInSeconds,
      this.beneficiary
    );
    await tx.wait();

    this.message = "Kampanja uspješno kreirana!";
    this.$emit("campaignCreated");
    
    // Resetiraj polja
    this.title = "";
    this.description = "";
    this.beneficiary = "";
    this.goal = "";
    this.duration = "";

  } catch (err) {
    console.error("Greška pri kreiranju kampanje:", err);
    this.error = err.reason || err.message;
  } finally {
    this.loading = false;
  }
}}
};
</script>

<style scoped>
.error { color: red; }
.success { color: green; }
.form-group { margin-bottom: 0.8rem; }
label { display: block; margin-bottom: 0.2rem; font-weight: bold; }
input, textarea {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}

</style>