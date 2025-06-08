<template>
  <div class="campaign-list">
    <h2>Popis kampanja</h2>
    <ul v-if="campaigns.length > 0">
      <li v-for="c in campaigns" :key="c.id">
        {{ c.id }}. {{ c.title }} —  
        ciljani ETH: {{ formatEther(c.goal) }},  
        prikupljeno ETH: {{ formatEther(c.pledged) }},  
        rok: {{ new Date(c.deadline * 1000).toLocaleString() }}  
        <span v-if="c.claimed">(isplaćeno)</span>
      </li>
    </ul>
    <p v-else>Još nema kreiranih kampanja.</p>
  </div>
</template>

<script>
import { ethers } from "ethers";

export default {
  name: "CampaignList",
  props: {
    campaigns: { type: Array, required: true }
  },
  methods: {
    formatEther(wei) {
      try {
        return ethers.utils.formatEther(wei);
      } catch {
        return "0";
      }
    }
  }
};
</script>

<style scoped>
.campaign-list { margin-top: 1rem; }
li { margin-bottom: 0.5rem; }
</style>