import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.5/ethers.min.js";

// 1) Zamijeni sljedeću adresu s adresom svoga deploy-anog Crowdfunding ugovora:
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// 2) U polje `abi` zalijepi ABI iz `artifacts/contracts/Crowdfunding.sol/Crowdfunding.json`
//   Primjer: kopiraj sve od [ do ] u JSON-u pod ključem "abi"
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

// Kad se stranica učita, pokušati se automatski spojiti na MetaMask i inicijalizirati ugovor
window.addEventListener("load", async () => {
  if (!window.ethereum) {
    alert("MetaMask nije pronađen. Instaliraj MetaMask i ponovno učitaj stranicu.");
    return;
  }
  // 1) Kreiraj provider (povezivanje s Ethereum mrežom preko MetaMaska)
  provider = new ethers.BrowserProvider(window.ethereum);
  // 2) Zatraži odobrenje korisnika za pristup računima
  await provider.send("eth_requestAccounts", []);
  // 3) Dohvati signer (trenutni račun)
  signer = await provider.getSigner();
  // 4) Kreiraj instancu ugovora
  contract = new ethers.Contract(contractAddress, abi, signer);
  // 5) Prikaži trenutno aktivne kampanje
  await displayCampaigns();
});

// Funkcija za prikaz aktivnih kampanja
async function displayCampaigns() {
  const campaigns = await contract.getCampaigns();
  // Dohvati trenutačno vrijeme u sekundi na blockchainu
  const block = await provider.getBlock("latest");
  const now = block.timestamp;

  const listDiv = document.getElementById("campaignList");
  listDiv.innerHTML = ""; // očisti prethodni sadržaj

  // Ako nema kampanja, prikaži poruku
  if (campaigns.length === 0) {
    listDiv.innerHTML = "<p>Još nema aktivnih kampanja.</p>";
    return;
  }

  // Iteriraj kroz sve vraćene kampanje
  campaigns.forEach((c, idx) => {
    // c = objekt s poljima: owner, goal, pledged, startAt, endAt, claimed
    const { owner, goal, pledged, startAt, endAt, claimed } = c;
    // Prikaži samo kampanje koje još nisu istekle
    if (now <= Number(endAt.toString())) {
      // Stvori novi div za kampanju
      const div = document.createElement("div");
      div.className = "campaign";

      // Konverzija vrijednosti iz Wei-a u ljudski čitljiv format (ETH) – opcionalno
      const goalEth = ethers.formatEther(goal.toString());
      const pledgedEth = ethers.formatEther(pledged.toString());
      const endDate = new Date(Number(endAt.toString()) * 1000).toLocaleString();

      div.innerHTML = `
        <p><strong>ID:</strong> ${idx} </p>
        <p><strong>Vlasnik:</strong> ${owner}</p>
        <p><strong>Cilj:</strong> ${goalEth} ETH</p>
        <p><strong>Prikupljeno:</strong> ${pledgedEth} ETH</p>
        <p><strong>Rok:</strong> ${endDate}</p>
      `;

      // Ako kampanja još traje, omogući pledganje
      if (!claimed && now <= Number(endAt.toString())) {
        const pledgeInput = document.createElement("input");
        pledgeInput.type = "number";
        pledgeInput.id = `pledgeAmt_${idx}`;
        pledgeInput.placeholder = "Iznos (ETH)";
        div.appendChild(pledgeInput);

        const pledgeBtn = document.createElement("button");
        pledgeBtn.innerText = "Pledge";
        pledgeBtn.onclick = async () => {
          const amountEth = pledgeInput.value;
          if (!amountEth || Number(amountEth) <= 0) {
            alert("Unesi ispravan iznos za uplatu.");
            return;
          }
          try {
            const amountWei = ethers.parseEther(amountEth.toString());
            const tx = await contract.pledge(idx, { value: amountWei });
            await tx.wait();
            alert("Uspješno uplatio/la " + amountEth + " ETH u kampanju #" + idx);
            await displayCampaigns();
          } catch (err) {
            alert("Greška pri uplati: " + err.message);
          }
        };
        div.appendChild(pledgeBtn);
      }

      listDiv.appendChild(div);
      listDiv.appendChild(document.createElement("hr"));
    }
  });
}

// Funkcija koja se poziva kad korisnik pritisne “Create Campaign” gumb
window.createCampaign = async function () {
  const goalInput = document.getElementById("goal").value;
  const durationInput = document.getElementById("duration").value;

  if (!goalInput || Number(goalInput) <= 0) {
    alert("Unesi ispravan cilj (> 0).");
    return;
  }
  if (!durationInput || Number(durationInput) <= 0) {
    alert("Unesi ispravno trajanje (> 0).");
    return;
  }

  try {
    // Konvertiraj cilj iz ETH (string) u Wei (BigInt)
    const goalWei = ethers.parseEther(goalInput.toString());
    const durationSec = Number(durationInput);

    // Pozovi pametni ugovor
    const tx = await contract.createCampaign(goalWei, durationSec);
    await tx.wait();
    alert("Kampanja je uspješno kreirana!");

    // Ponovno prikaži kampanje (ako je odmah aktivna)
    await displayCampaigns();
  } catch (err) {
    alert("Greška pri kreiranju kampanje: " + err.message);
  }
};