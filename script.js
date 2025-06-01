import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

// TODO: Unesite adresu deploy-anog ugovora ispod
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

// ABI pametnog ugovora (kopirajte iz artifacts/contracts/Crowdfunding.sol/Crowdfunding.json)
const abi = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_goal", "type": "uint256" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }],
    "name": "pledge",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }],
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCampaigns",
    "outputs": [
      {
        "components": [
          { "internalType": "address payable", "name": "owner", "type": "address" },
          { "internalType": "uint256", "name": "goal", "type": "uint256" },
          { "internalType": "uint256", "name": "pledged", "type": "uint256" },
          { "internalType": "uint256", "name": "startAt", "type": "uint256" },
          { "internalType": "uint256", "name": "endAt", "type": "uint256" },
          { "internalType": "bool", "name": "claimed", "type": "bool" }
        ],
        "internalType": "struct Crowdfunding.Campaign[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider, signer, contract;

// Inicijalizacija prilikom učitavanja stranice
window.addEventListener('load', async () => {
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    signer = await provider.getSigner();
    contract = new ethers.Contract(contractAddress, abi, signer);
    await displayCampaigns();
  } else {
    alert('Molimo instalirajte MetaMask!');
  }
});

// Funkcija za prikaz aktivnih kampanja
async function displayCampaigns() {
  const campaigns = await contract.getCampaigns();
  const block = await provider.getBlock("latest");
  const now = block.timestamp;

  const campaignList = document.getElementById('campaignList');
  campaignList.innerHTML = '';

  campaigns.forEach((c, id) => {
    // Prikaži samo kampanje koje još traju (aktivne)
    if (c.endAt > now) {
      const div = document.createElement('div');
      div.innerHTML = `<strong>ID:</strong> ${id} | <strong>Owner:</strong> ${c.owner} |
        <strong>Goal:</strong> ${c.goal} wei | <strong>Pledged:</strong> ${c.pledged} wei |
        <strong>Ends:</strong> ${new Date(c.endAt * 1000).toLocaleString()}<br>`;

      // Unos za iznos za pledge
      const pledgeInput = document.createElement('input');
      pledgeInput.type = 'number';
      pledgeInput.id = `pledgeAmount${id}`;
      pledgeInput.placeholder = 'Amount (wei)';
      div.appendChild(pledgeInput);

      // Gumb za pledgati
      const pledgeBtn = document.createElement('button');
      pledgeBtn.innerText = 'Pledge';
      pledgeBtn.onclick = async () => {
        const amount = pledgeInput.value;
        if (!amount) return;
        try {
          await contract.pledge(id, { value: BigInt(amount) });
          alert('Pledged successfully!');
          await displayCampaigns();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      };
      div.appendChild(pledgeBtn);

      // Ako je kampanja završila i postigla cilj, omogući withdraw vlasniku
      if (now > c.endAt && c.pledged >= c.goal && !c.claimed) {
        const withdrawBtn = document.createElement('button');
        withdrawBtn.innerText = 'Withdraw';
        withdrawBtn.onclick = async () => {
          try {
            await contract.withdraw(id);
            alert('Withdraw successful!');
            await displayCampaigns();
          } catch (err) {
            alert('Error: ' + err.message);
          }
        };
        div.appendChild(withdrawBtn);
      }

      // Ako je kampanja završila i cilj nije postignut, omogući refund svima
      if (now > c.endAt && c.pledged < c.goal) {
        const refundBtn = document.createElement('button');
        refundBtn.innerText = 'Refund';
        refundBtn.onclick = async () => {
          try {
            await contract.refund(id);
            alert('Refund successful!');
            await displayCampaigns();
          } catch (err) {
            alert('Error: ' + err.message);
          }
        };
        div.appendChild(refundBtn);
      }

      campaignList.appendChild(div);
    }
  });
}

// Funkcija za kreiranje nove kampanje
async function createCampaign() {
  const goalInput = document.getElementById('goal').value;
  const durationInput = document.getElementById('duration').value;
  if (!goalInput || !durationInput) {
    alert('Unesite goal i duration!');
    return;
  }
  try {
    await contract.createCampaign(BigInt(goalInput), BigInt(durationInput));
    alert('Campaign created!');
    await displayCampaigns();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}