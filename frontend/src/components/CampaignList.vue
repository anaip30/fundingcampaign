<template>
  <div class="campaign-list-container">
    <h2>Popis kampanja ({{ campaigns.length }})</h2>
    <div v-if="campaigns.length === 0" class="component-card">
      <p>Nema aktivnih kampanja.</p>
    </div>
    <div v-else class="campaign-grid">
      <div v-for="c in campaigns" :key="c.id" class="campaign-card">
        <div class="card-header">
          <h3>{{ c.id }}. {{ c.title }}</h3>
          <span :class="['status-badge', getStatus(c).class]">{{ getStatus(c).text }}</span>
        </div>
        
        <p class="description">{{ c.description }}</p>

        <div class="progress-bar">
          <div class="progress" :style="{ width: getPercentage(c.pledged, c.goal) + '%' }"></div>
        </div>
        <div class="progress-text">
          <span>{{ formatEth(c.pledged) }} ETH</span>
          <span>({{ getPercentage(c.pledged, c.goal) }}%)</span>
        </div>

        <ul class="details-list">
          <li><span>Cilj</span> <strong>{{ formatEth(c.goal) }} ETH</strong></li>
          <li><span>Rok</span> <strong>{{ formatDate(c.deadline) }}</strong></li>
          <li><span>Kreator</span> <span class="address">{{ c.creator }}</span></li>
          <li><span>Primatelj</span> <span class="address">{{ c.beneficiary }}</span></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";

export default {
  name: "CampaignList",
  props: {
    campaigns: { type: Array, required: true },
  },
  methods: {
    formatEth(wei) {
      return ethers.utils.formatEther(wei);
    },
    formatDate(timestamp) {
      if (timestamp === 0) return "N/A";
      // PROMJENA: Koristi se toLocaleString() za prikaz datuma i vremena
      return new Date(timestamp * 1000).toLocaleString("hr-HR");
    },
    getPercentage(pledged, goal) {
      if (goal.isZero() || pledged.isZero()) return 0;
      const hundred = ethers.BigNumber.from("100");
      const percentage = pledged.mul(hundred).div(goal);
      return percentage.gt(hundred) ? 100 : percentage.toNumber();
    },
    getStatus(campaign) {
      const now = Math.floor(Date.now() / 1000);
      if (campaign.claimed) {
        return { text: "Isplaćeno", class: 'status-claimed' };
      }
      if (now >= campaign.deadline) {
        if (campaign.pledged >= campaign.goal) {
          return { text: "Uspješno", class: 'status-successful' };
        } else {
          return { text: "Neuspješno", class: 'status-failed' };
        }
      }
      return { text: "Aktivno", class: 'status-active' };
    },
  },
};
</script>

<style scoped>
.campaign-list-container {
  background-color: var(--bg-surface);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.campaign-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.campaign-card {
  background-color: var(--bg-main);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: border-color 0.2s;
}
.campaign-card:hover {
  border-color: var(--primary-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.card-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}
.status-active { background-color: var(--success-color); color: #fff; }
.status-successful { background-color: var(--primary-color); color: #fff; }
.status-failed { background-color: var(--error-color); color: #fff; }
.status-claimed { background-color: var(--text-secondary); color: var(--bg-main); }


.description {
  font-style: italic;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.progress-bar {
  background-color: var(--bg-input);
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.progress {
  background-color: var(--primary-color);
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease-in-out;
}
.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.details-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.9rem;
}
.details-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}
.details-list li:last-child {
  border-bottom: none;
}
.details-list li span {
  color: var(--text-secondary);
}
.details-list li strong {
  color: var(--text-primary);
}
.details-list li .address {
  font-family: monospace;
  max-width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>